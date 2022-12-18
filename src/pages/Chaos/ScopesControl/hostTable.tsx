import AddExperiment from './AddExperiment';
import React, { FC, useEffect, useState } from 'react';
import Translation from 'components/Translation';
import _ from 'lodash';
import formatDate2 from 'pages/Chaos/lib/DateUtil2';
import i18n from '../../../i18n';
import locale from 'utils/locale';
import styles from './index.css';

import Actions, { LinkButton } from '@alicloud/console-components-actions';
// import ManualDialog from 'pages/Manage/AgentSetting/common/ManualDialog';
// import { /* AGENT_STATUS, */ FILTER_TYPE /* , SCOPE_TYPE */ } from 'pages/Chaos/lib/FlowConstants';
import { /* IDataRecord, */ IOwnerFilter } from 'config/interfaces/Chaos/application';
// import { pushUrl /* , removeParams */ } from 'utils/libs/sre-utils';
// import { useHistory } from 'dva';

import {
  Pagination,
  Search,
  Table,
} from '@alicloud/console-components';
import { useDispatch, useSelector } from 'utils/libs/sre-utils-dva';
interface IPorps {
  currTab: number;
  empty: any;
  changeSuccessNumber: (tab: number, info: string) => void; // 更新统计信息
}
// const v_a_b_r = classnames({ [styles.v_a_b]: true, [styles.mr10]: true });
// const v_a_b_r_r = classnames({ [styles.v_a_b]: true, [styles.mr10]: true, [styles.red]: true });

const HostTable: FC<IPorps> = props => {
  const { currTab, empty } = props;
  const pageSize = 10;
  const [ page, setPage ] = useState(1);
  const [ total, setTotal ] = useState(0);
  const [ filterValue, setFilterValue ] = useState('All');
  const [ searchKey, setSearchKey ] = useState('');
  const [ dataSource, setDataSource ] = useState<any[]>([]);
  const [ ownerDataSource, setOwnerDataSource ] = useState<IOwnerFilter[]>([]);
  // const [ showManualDialog, setShowManualDialog ] = useState<boolean>(false); // 手动卸载弹框
  // const [ pluginType, setPluginType ] = useState<string>('');
  // const [ isUninstall, setIsUninstall ] = useState<boolean>(false);
  // const [ isInstall, setIsInstall ] = useState<any>(undefined);
  // const [ configurationId, setConfigurationId ] = useState<string>('');
  // const [ ostype, setOsType ] = useState(NaN);
  const [ width1, setWidth1 ] = useState(40);
  const [ width2, setWidth2 ] = useState(80);
  const [ visible, setVisible ] = useState<boolean>(false);
  const [ record, setRecord ] = useState<any>({});
  // const installStatusLoopInterval = useRef<{ [key: string]: any }>({});

  const { loading } = useSelector(state => {
    return {
      loading: state.loading.effects['scopesControl/getExperimentScopes'],
    };
  });
  const dispatch = useDispatch();
  // const history = useHistory();
  useEffect(() => {
    setPage(1);
  }, [ currTab ]);
  useEffect(() => {
    // if (currTab !== SCOPE_TYPE.HOST) {
    //  return;
    // }
    getData();
  }, [ currTab, page, filterValue, searchKey ]);
  /*
  useEffect(() => {
    const successData = dataSource.filter((x: IDataRecord) => x.agentStatus === AGENT_STATUS.ONLINE).length;
    changeSuccessNumber(currTab, `${successData}/${total}`);
  }, [ total ]); */
  const getData = async () => {
    const { Data } = await dispatch.scopesControl.getExperimentScopes({
      scope_type: currTab,
      filter: {
        type: filterValue,
        key: searchKey,
      },
      size: pageSize,
      page,
    });
    const datas = _.get(Data, 'data', []);
    setDataSource([]);
    setDataSource(datas);
    setTotal(Data?.total || 0);
    const owners = _.get(Data, 'owners', []);
    setOwnerDataSource([]);
    setOwnerDataSource(owners);
  };
  /** table 操作 按钮 */
  const renderOption: any = (value: string, index: number, rc: any) => {
    // const { masterAccountId, masterAccountName, masterAccountOwner } = record;
    // console.log(index);
    const btns: { [key: string]: JSX.Element } = {
      installBtn: <span className={styles.red}><a className={styles.ml10} onClick={() => toggleExpDialog(rc)} style={{ cursor: 'pointer' }}><Translation>Click install</Translation></a></span>,
    };
    const btnKeys = [ 'clinkInstallBtn' ];
    return (
      <Actions style={{ justifyContent: 'center' }}>
        {btnKeys.map(item => btns[item])}
        <LinkButton onClick={() => toggleExpDialog(rc)}><Translation>Follow Up</Translation></LinkButton>
      </Actions>
    );
  };
  function handleFilterChange(value: any) {
    setFilterValue(value);
    setPage(1);
  }

  function handleSearch(value: string) {
    setSearchKey(value);
    setPage(1);
  }
  /*
  const renderName: any = (value: string, index: number, record: IAppLicationScopeOrContorlRecord) => {
    return <span className={styles.href} onClick={() => {
      pushUrl(history, '/chaos/experiment/scope/detail', {
        id: record.configurationId,
      });
      removeParams('configurationId');
    }}>{value}</span>;
  };

  const renderIsexperiment: any = (value: boolean) => {
    return value ? i18n.t('Yes') : i18n.t('No');
  };
  const renderStatus: any = (value: number) => {
    if (value === AGENT_STATUS.ONLINE) {
      return <span><Icon type="select" className={classnames(styles.onLineState, styles.icon)} /><Translation>Online</Translation></span>;
    }
    if (value === AGENT_STATUS.WAIT_INSTALL) {
      return <span><Icon type="minus-circle-fill" className={classnames(styles.icon, styles.notInstall)} /><Translation>Not Installed</Translation></span>;
    }

    if (value === AGENT_STATUS.OFFLINE) {
      return <span><Icon type="exclamationcircle-f" className={classnames(styles.icon, styles.offLineState)} /><Translation>Offline</Translation></span>;
    }
  };
  */
  const renderNumber: any = (value: number) => {
    return <span>{Math.round(value)}</span>;
  };
  const onResizeChange = (dataIndex, value) => {
    if (dataIndex === 'masterAccountId') {
      setWidth1(width1 + value);
    } else {
      setWidth2(width2 + value);
    }
  };
  const handleCancel = () => {
    setVisible(!visible);
  };
  const toggleExpDialog = rc => {
    setRecord(rc);
    setVisible(!visible);
  };
  return (
    <div className={styles.tabContent}>
      <Search
        placeholder={i18n.t('Account Name')}
        shape="simple"
        className={styles.searchContent}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        filter={ownerDataSource}
        filterValue={filterValue}
      />
      <Table
        onResizeChange={onResizeChange}
        primaryKey='masterAccountId'
        dataSource={loading ? [] : dataSource}
        hasBorder={true}
        emptyContent={empty}
        loading={loading}
        locale={locale().Table}
      >
        <Table.Column title={i18n.t('Account Id').toString()} dataIndex='masterAccountId' width={width1} resizable />
        <Table.Column title={i18n.t('Account Name').toString()} dataIndex={'masterAccountName'} width={width2} resizable/>
        <Table.Column title={i18n.t('Owner').toString()} dataIndex="masterAccountOwner" width={80} />
        <Table.Column title={i18n.t('Phase').toString()} dataIndex="phase" width={40} />
        <Table.Column title={i18n.t('Territory').toString()} dataIndex="territory" width={80} />
        <Table.Column title={i18n.t('Month').toString()} dataIndex="variable" width={50} cell={formatDate2} />
        <Table.Column title={i18n.t('Rev').toString()} dataIndex="value" width={50} />
        <Table.Column title={i18n.t('Left').toString()} dataIndex="left" width={50} cell={renderNumber}/>
        <Table.Column title={i18n.t('Right').toString()} dataIndex="right" width={50} cell={renderNumber}/>
        <Table.Column title={i18n.t('Operation').toString()} lock="right" align={'center'} width={90} cell={renderOption} />
      </Table>
      <Pagination
        className={styles.pagination}
        current={page}
        total={total}
        pageSize={pageSize}
        locale={locale().Pagination}
        onChange={current => setPage(current)}
      />
      <AddExperiment getExperimentTotals={5} visible={visible} onCancel={handleCancel} record={record}/>
    </div>
  );
};

export default HostTable;

