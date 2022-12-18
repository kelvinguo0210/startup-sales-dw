FROM public.ecr.aws/lambda/python:3.8

COPY src/app.py ${LAMBDA_TASK_ROOT}
COPY req.txt  .
COPY *.json   /
RUN  pip3 install -r req.txt --target "${LAMBDA_TASK_ROOT}" -i http://pypi.douban.com/simple/ --trusted-host pypi.douban.com

CMD [ "app.handler" ] 