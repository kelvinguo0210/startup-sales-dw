import React, { /* useEffect, */ useState } from 'react';
import Translation from 'components/Translation';
import i18n from '../../../../i18n';
import locale from 'utils/locale';
import styles from './index.css';
import { Box, Card, Dialog, Icon, Input, Message, Radio } from '@alicloud/console-components';
import { getParams } from 'utils/libs/sre-utils';
import { useDispatch } from 'utils/libs/sre-utils-dva';
const RadioGroup = Radio.Group;

const rg = [
  {
    value: 0,
    label: 'High',
  },
  {
    value: 1,
    label: 'Midium',
  },
  {
    value: 2,
    label: 'Low',
  },
];

const AddExperiment = (props: any) => {
  const workspaceId = getParams('workspaceId');
  const { record } = props;
  const dispatch = useDispatch();
  // const [ dataSource, setDataSource ] = useState([]);
  const [ addParams ] = useState([]);
  // const [ searchKey ] = useState('');
  const [ rgValue, setRgValue ] = useState(2);

  /*
  useEffect(() => {
    (async function() {
      if (workspaceId && props.visible) {
        const { Data = false } = await dispatch.experimentList.searchExperiments({ searchKey, page, workspaceId });
        if (Data) {
          setDataSource(dataSource.concat(Data));
        }
      }
    })();
  }, [ searchKey, page, props.visible ]);
  */
  async function addExprtiment() {
    const { Success, Data } = await dispatch.experimentList.addWorkspaceExperiment({ workspaceId, workspaceExperimentList: addParams });
    if (Success) {
      if (Data.duplicateExperiments.length !== 0) {
        Message.error(i18n.t('This walkthrough already exists, please do not add it again'));
      } else {
        Message.success(i18n.t('Added successfully'));
        props.getExperimentTotals();
      }
    }
  }

  function handleSave() {
    addExprtiment();
    props.onCancel && props.onCancel();
  }

  const onRgChange = value => {
    setRgValue(value);
  };

  const cardProps = {
    style: { width: 600 },
    title: 'Account Id: ',
    subTitle: record.masterAccountId,
    extra: <Icon type='more' />,
    contentHeight: 400,
  };

  return (
    <Dialog
      visible={props.visible}
      title={i18n.t('Add following up').toString()}
      onOk={handleSave}
      onCancel={props.onCancel}
      onClose={props.onCancel}
      locale={locale().Dialog}
    >
      <div className={styles.centered}>
        <Card { ...cardProps }>
          <div className={styles.warp}>
            <Box spacing={20} direction="column" align="center">
              <div>
                <Input style={{ width: 400 }} maxLength={500} placeholder="Small" size="large" label={<Translation>Account Name</Translation>} id="J_InputSmall" readOnly={true} defaultValue={record.masterAccountName}/>
              </div>
              <div>
                <Input style={{ width: 400 }} maxLength={500} placeholder="Small" size="large" label={<Translation>Account Owner</Translation>} id="J_InputSmall" readOnly={true} defaultValue={record.masterAccountOwner}/>
              </div>
              <div>
                <span><Translation>Priority</Translation>:  </span><RadioGroup dataSource={rg} value={rgValue} onChange={onRgChange} />
              </div>
              <div>
                <span><Translation>Follow Up</Translation>:  </span>
                <br/>
                <Input.TextArea style={{ width: 400, height: 200 }} placeholder="comments..." maxLength={400} rows={4} showLimitHint aria-label="input max length 400" />
              </div>
            </Box>
          </div>
        </Card>
      </div>

    </Dialog>
  );
};

export default AddExperiment;
