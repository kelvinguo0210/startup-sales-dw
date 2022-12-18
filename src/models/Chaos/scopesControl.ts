import createServiceChaos from 'utils/createServiceChaos';
import { BaseModel, dvaModel, effect } from 'utils/libs/sre-utils-dva';
import { IListExperimentNodesByCluster, IQueryExperimentScopesReq, IQueryScopeControlDetailReq, IQueryScopeControlPodReq } from 'config/interfaces/Chaos/scopesControl';
// import { jsonData } from './abc.json';

@dvaModel('scopesControl')
class ScopesControl extends BaseModel {

  state = null; // 演练消费记录中的所有数据都不需要共享；

  formatArr = (arr, key) => {
    const newArr = [{ label: 'All', value: '0' }];
    const map = new Map();
    for (const item of arr) {
      if (!map.has(item[key])) {
        map.set(item[key], item[key]);
      }
    }
    [ ...map.values() ].sort().reduce((acc, cur) => {
      newArr.push({ label: cur, value: cur });
      return 0;
    }, []);

    return newArr;
  };

  @effect()
  *getExperimentScopes(payload: IQueryExperimentScopesReq) {
    // console.log(payload);
    const page = payload.page;
    const size = payload.size;
    const res = yield this.effects.call(createServiceChaos('data'), payload);
    const jsonData = res.Data;
    const _owners = this.formatArr(jsonData, 'masterAccountOwner');
    // console.log(_owners);
    // const _accounts = this.formatArr(jsonData, 'masterAccountName');
    // console.log(_accounts);
    let dataTemp = jsonData;

    // filter
    if (payload.filter.type !== 'All') {
      dataTemp = jsonData.filter(current => {
        return current.masterAccountOwner === payload.filter.type;
      });
    }
    if (payload.filter.key !== '') {
      dataTemp = jsonData.filter(current => {
        return current.masterAccountName.search(payload.filter.key) !== -1;
      });
    }
    const t = dataTemp.length;

    if (page * size > t) {
      dataTemp = dataTemp.slice((page - 1) * size);
    } else {
      if (page === 1) {
        dataTemp = dataTemp.slice(0, page * size);
      } else {
        dataTemp = dataTemp.slice((page - 1) * size, page * size);
      }
    }
    // return res?.Data || { Data: { data: dataTemp, total: t } };
    // console.log('length of dataTemp: ' + dataTemp.length);
    return { Data: { data: dataTemp, total: t, owners: _owners } };
  }

  @effect()
  *getListExperimentClusters() {
    return yield this.effects.call(createServiceChaos('ListExperimentClusters'));
  }

  @effect()
  *getScopeSceneFunctionCount(payload: IQueryScopeControlDetailReq) {
    return yield this.effects.call(createServiceChaos('CountExperimentScopeSceneFunctionCount'), payload);
  }

  @effect()
  *getScopeInfo(payload: IQueryScopeControlDetailReq) {
    return yield this.effects.call(createServiceChaos('QueryScopeInfo'), payload);
  }

  @effect()
  *getScopeInvocation(payload: IQueryScopeControlDetailReq) {
    return yield this.effects.call(createServiceChaos('CountExperimentScopeInvocation'), payload);
  }

  @effect()
  *getExperimentTaskScopes(payload: IQueryScopeControlDetailReq) {
    return yield this.effects.call(createServiceChaos('PageableQueryExperimentTaskByScope'), payload);
  }

  @effect()
  *getSearchExperimentPodsByNode(payload: IQueryScopeControlPodReq) {
    return yield this.effects.call(createServiceChaos('SearchExperimentPodsByNode'), payload);
  }

  @effect()
  *getListExperimentNodesByCluster(payload: IListExperimentNodesByCluster) {
    return yield this.effects.call(createServiceChaos('ListExperimentNodesByCluster'), payload);
  }
}

export default new ScopesControl().model;

declare global {
  interface Actions {
    scopesControl: ScopesControl;
  }
}
