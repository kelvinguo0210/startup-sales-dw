import logging
import os
import json
from datetime import datetime
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

LOGGER = logging.getLogger(__name__)
LOGGER.setLevel(logging.INFO)

account = boto3.client('sts').get_caller_identity().get('Account')
session = boto3.session.Session()
region = session.region_name 
if 'cn-north' in region:
    partition = '.cn'
else:
    partition = ''
    
LOGGER.info('account Id : %s', account)
LOGGER.info('region : %s', region)   

table_name = 'startup-sale-followups'
default_white_list = 'kwm-model-a, kwm-model-b'



class Followups:
    def __init__(self, dyn_resource):
        self.dyn_resource = dyn_resource
        self.table = None

    def exists(self, table_name):
        try:
            table = self.dyn_resource.Table(table_name)
            table.load()
            exists = True
        except ClientError as err:
            if err.response['Error']['Code'] == 'ResourceNotFoundException':
                exists = False
            else:
                logger.error(
                    "Couldn't check for existence of %s. Here's why: %s: %s",
                    table_name,
                    err.response['Error']['Code'], err.response['Error']['Message'])
                raise
        else:
            self.table = table
        return exists

    
    def create_table(self, table_name):
        try:
            self.table = self.dyn_resource.create_table(
                TableName=table_name,
                KeySchema=[
                    {'AttributeName': 'job_id', 'KeyType': 'HASH'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'job_id', 'AttributeType': 'S'}
                ],
                ProvisionedThroughput={'ReadCapacityUnits': 10, 'WriteCapacityUnits': 10})
            self.table.wait_until_exists()
        except ClientError as err:
            logger.error(
                "Couldn't create table %s. Here's why: %s: %s", table_name,
                err.response['Error']['Code'], err.response['Error']['Message'])
            raise
        else:
            return self.table

    def add_followup(self, fu):
        try:
            self.table.put_item(Item=fu)
        except ClientError as err:
            LOGGER.error(
                "Couldn't add followup to table %s. Here's why: %s: %s", self.table.name,
                err.response['Error']['Code'], err.response['Error']['Message'])
            raise

            
    def get_followup(self, job_id):
        try:
            response = self.table.get_item(Key={'job_id': job_id})
            #print(response)
        except ClientError as err:
            logger.error(
                "Couldn't get followup %s from table %s. Here's why: %s: %s",
                title, self.table.name,
                err.response['Error']['Code'], err.response['Error']['Message'])
            raise
        else:
            return response.get('Item')

def makeResp(errCode=200, errMsg=''):
    with open('/up.json') as fUp:
        up = json.load(fUp)
    return {
        "statusCode": errCode,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        "body": json.dumps( {'code': errCode, 'success': 'true', 'Data': up }  )          
    }

def getData(scope_type=0):
    if scope_type == 0:
      with open('/up.json') as f:
          jsonFile = json.load(f)
    else:
      with open('/down.json') as f:
          jsonFile = json.load(f)
    
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        "body": json.dumps( {'code': 200, 'success': 'true', 'Data': jsonFile }  )          
    }

def addFollowUp(payload=None):
    headers = {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        }
    
    accountId = payload.get('r').get('accountId')
    accountName = payload.get('r').get('accountName')
    accountOwner = payload.get('r').get('accountOwner')
    month = payload.get('r').get('variable')
    rev = payload.get('r').get('value')
    abnormalType = payload.get('abnormalType')
    priority = payload.get('rgValue')
    followup = payload.get('textValue')
    
    ddb = boto3.resource('dynamodb')
    followups = Followups(ddb)
    followups_exist = followups.exists(table_name)
    if not followups_exist:
        followups.create_table(table_name)
        
    LOGGER.info('here we go @1... ')
    
    fu = { 'accountId': accountId,
           'accountName': accountName,
           'accountOwner': accountOwner,
           'month': month,
           'rev': rev,
           'abnormalType': abnormalType,
           'priority': priority,
           'createTime': round(datetime.now().timestamp()) 
         }
    
    LOGGER.info('here we go @2... ')
    
    followups.add_followup(fu)
    
    LOGGER.info('here we go @3... ')
            
    return {
        "statusCode": 200,
        "headers":headers,
        "body": json.dumps( {'code': 200, 'success': 'true', 'Data': [] }  )          
    }

    
def handler(event, context):
    LOGGER.info('Event: %s', event)
    stage_vars = event['stageVariables']
    white_list = stage_vars.get('white_list', default_white_list)
    LOGGER.info('white_list: %s', white_list)
    
    payload = json.loads(event['body'])
    res = event.get('resource')
    if res == "/data":
        if len(payload):
            scope_type = payload['scope_type']
            LOGGER.info('imcoming scope_type: %s', scope_type)
            return getData(scope_type=scope_type) 
    elif res == "/data/addFollowup":
        return addFollowUp(payload)
    else:
        errMsg = 'not support!'
        return makeResp(errCode=501, errMsg=errMsg)