import _ from 'lodash';
import createServiceChaos from 'utils/createServiceChaos';
import { BaseModel, dvaModel, effect, reducer } from 'utils/libs/sre-utils-dva';
import { IAppCode, IExpertiseId } from 'config/interfaces/Chaos/expertiseEditor';
import { IBaseInfo, ICronExpression, IExperiment, IExperimentId, IFlowGroup, IFlowInfo, INode } from 'config/interfaces/Chaos/experiment';
import { NODE_TYPE } from 'pages/Chaos/lib/FlowConstants';
import { convertNode, dealCopyNode, initExperimentFlow } from './experimentInit';
import { v4 as uuidv4 } from 'uuid';

interface IExperimentEditorState {
  experimentData: {
    flowInfo: IFlowInfo;
    experimentId: string;
    basicInfo: IBaseInfo;
  };
  experiment: IExperiment;
  createExperimentId: string;
}

const DEFAULT_STATE: IExperimentEditorState = {
  experimentData: {
    flowInfo: {
      experimentId: '',
      runMode: 'SEQUENCE',
      state: '',
      duration: 900,
      schedulerConfig: {
        cronExpression: '',
      },
      flowGroups: [],
      guardConf: {
        guards: [],
      },
    },
    experimentId: '',
    basicInfo: {
      experimentId: '',
      name: '',
      description: '',
      gmtCreate: '',
      tags: [],
      miniAppDesc: [],
      workspaces: [],
      relations: [],
    },
  },
  experiment: {
    id: '',
    experimentId: '',
    baseInfo: {
      experimentId: '',
      name: '',
      description: '',
      gmtCreate: '',
      tags: [],
      miniAppDesc: [],
      workspaces: [],
      relations: [],
    },
    flow: {
      experimentId: '',
      runMode: 'SEQUENCE',
      state: '',
      duration: 900,
      schedulerConfig: {
        cronExpression: '',
      },
      flowGroups: [],
      guardConf: {
        guards: [],
      },
    },
    observerNodes: [],
    recoverNodes: [],
  },
  createExperimentId: '',
};


@dvaModel('experimentEditor')
class ExperimentEditor extends BaseModel {
  state: IExperimentEditorState = DEFAULT_STATE;

  @reducer
  setExperiment(payload: IExperimentEditorState['experimentData']) {
    let { experiment } = this.state;
    if (!_.isEmpty(payload)) {
      const { flowInfo, basicInfo } = payload;
      const mergeExperiment = {
        experimentId: payload.experimentId, // id???????????????1???
        flow: { ...flowInfo },
        baseInfo: { ...basicInfo },
      };
      experiment = initExperimentFlow(mergeExperiment);
    } else {
      const newExperiment = {
        experimentId: payload.experimentId, // id???????????????1???
        flow: {
          experimentId: payload.experimentId,
          runMode: 'SEQUENCE', // runMode????????????????????????
          duration: 900, // ????????????????????????900???
          schedulerConfig: {
            cronExpression: '',
          },
        },
        baseInfo: {
          experimentId: payload.experimentId,
          name: '',
          description: '',
          tags: [],
          miniAppDesc: [],
          workspaces: [],
          relations: [],
        },
      };
      experiment = initExperimentFlow(newExperiment);
    }
    return {
      ...this.state,
      experiment,
    };
  }

  @reducer
  setClearExperiment() {
    return {
      ...this.state,
      experiment: {
        id: '',
        experimentId: '',
        baseInfo: {
          experimentId: '',
          name: '',
          description: '',
          gmtCreate: '',
          tags: [],
          miniAppDesc: [],
          workspaces: [],
          relations: [],
        },
        flow: {
          experimentId: '',
          runMode: 'SEQUENCE',
          state: '',
          duration: 900,
          schedulerConfig: {
            cronExpression: '',
          },
          flowGroups: [],
          guardConf: {
            guards: [],
          },
        },
        observerNodes: [],
        recoverNodes: [],
      },
      createExperimentId: '',
    };
  }

  @reducer
  setUpdateBaseInfo(payload: IBaseInfo) {
    let { experiment } = this.state;
    let newBasicInfo;
    if (!_.isEmpty(payload)) {
      newBasicInfo = {
        ...payload,
      };
    }
    _.set(experiment, 'baseInfo', { ...newBasicInfo });
    experiment = initExperimentFlow(experiment);
    return {
      ...this.state,
      experiment: {
        ...experiment,
      },
    };
  }

  @reducer
  setAddOrUpdateFlowGroup(payload: IFlowGroup) {
    const { experiment } = this.state;
    const flowGroup = { ...payload };
    if (_.isEmpty(flowGroup)) {
      return;
    }
    // ????????????id?????????1???
    if (!flowGroup.id) {
      flowGroup.id = uuidv4();
    }
    // ???????????????????????????
    if (!_.isEmpty(flowGroup) && flowGroup.app_name) {
      const { hosts, appName, appGroups, appId, appType } = flowGroup;
      hosts.forEach(h => {
        h.appName = appName;
        h.appGroups = appGroups;
        h.appId = appId;
        h.appType = appType;
      });
    }

    let flowGroups = _.get(experiment, 'flow.flowGroups', []);
    const exist = _.filter(flowGroups, (fg: IFlowGroup) => fg.id === flowGroup.id);
    if (!_.isEmpty(exist)) {
      flowGroups = _.map(flowGroups, (fg: IFlowGroup) => {
        if (fg.id === flowGroup.id) {
          return flowGroup;
        }
        return fg;
      });
    } else {
      flowGroups = [ ...flowGroups, flowGroup ];
    }
    _.set(experiment, 'flow.flowGroups', flowGroups);
    return {
      ...this.state,
      experiment: {
        ...experiment,
      },
    };
  }

  @reducer
  setCopyFlowGroups(payload: IFlowGroup) {
    const { experiment } = this.state;
    if (_.isEmpty(payload)) {
      return;
    }

    const flows = _.get(payload, 'flows', []);
    flows.forEach(it => {
      it.id = uuidv4(); it.flowId = '';
      dealCopyNode(it.attack);
      dealCopyNode(it.check);
      dealCopyNode(it.prepare);
      dealCopyNode(it.recover);
    });

    // ???????????????????????????id
    const copyFlowGroup = {
      ...payload,
      id: uuidv4(),
      groupId: '',
      groupName: `??????????????????${payload && payload.groupName}`,
      flows: [ ...flows ],
    };

    let flowGroups = _.get(experiment, 'flow.flowGroups', []);
    flowGroups = _.concat(flowGroups, copyFlowGroup);
    _.set(experiment, 'flow.flowGroups', flowGroups);

    return {
      ...this.state,
      experiment: {
        ...experiment,
      },
    };
  }

  @reducer
  setUpdateFlowGroups(payload: IFlowGroup) {
    const { experiment } = this.state;
    _.set(experiment, 'flow.flowGroups', payload);
    return {
      ...this.state,
      experiment: {
        ...experiment,
      },
    };
  }

  @reducer
  setChangeRunMode(payload: string) {
    const { experiment } = this.state;
    _.set(experiment, 'flow.runMode', payload);
    return {
      ...this.state,
      experiment: {
        ...experiment,
      },
    };
  }

  @reducer
  setChangeTimeOut(payload: number | undefined) {
    const { experiment } = this.state;
    _.set(experiment, 'flow.duration', payload);

    return {
      ...this.state,
      experiment: {
        ...experiment,
      },
    };
  }

  @reducer
  setDeleteGuardNode(node: INode) {
    const { experiment } = this.state;
    if (!_.isEmpty(experiment)) {
      const { observerNodes, recoverNodes } = experiment;

      // ???????????? experiment.flow.guardConf.guards???????????????????????????undefined??????
      let { guards } = experiment.flow.guardConf;

      if (node.id) {
        // ?????????????????????
        if (node.nodeType === NODE_TYPE.OBSERVER) {
          experiment.observerNodes = _.filter(observerNodes, (n: INode) => n.id !== node.id);
        } else if (node.nodeType === NODE_TYPE.RECOVER) {
          experiment.recoverNodes = _.filter(recoverNodes, (n: INode) => n.id !== node.id);
        }

        // ?????????????????????
        guards = _.filter(guards, (n: INode) => n.id !== node.id);
        _.set(experiment, 'flow.guardConf.guards', guards);
      }
    }

    return {
      ...this.state,
      experiment: {
        ...experiment,
      },
    };
  }

  @reducer
  setSchedulerConfig(payload: ICronExpression) {
    const { experiment } = this.state;

    _.set(experiment, 'flow.schedulerConfig', payload);
    return {
      ...this.state,
      experiment: {
        ...experiment,
      },
    };
  }

  @reducer
  setAddOrUpdateGuardNode(node: INode) {
    const { experiment } = this.state;

    if (_.isEmpty(experiment)) {
      // ?????????experiment??????????????????stepOne?????????????????????stepTwo
      return this.state;
    }

    // ???????????????
    experiment.observerNodes = experiment.observerNodes || [];
    experiment.recoverNodes = experiment.recoverNodes || [];
    if (!_.get(experiment, 'flow.guardConf.guards')) {
      _.set(experiment, 'flow.guardConf.guards', []);
    }

    const { observerNodes, recoverNodes } = experiment;

    let guards = _.get(experiment, 'flow.guardConf.guards', []);
    // ????????????id?????????1???
    // ??????????????????????????????node.functionId?????????????????????functionId?????????????????????????????????????????????
    if (!node.id) {
      node.id = uuidv4();
    }

    // ?????????????????????
    let rawNodes: INode[] = [];
    if (node.nodeType === NODE_TYPE.OBSERVER) {
      rawNodes = observerNodes;
    } else if (node.nodeType === NODE_TYPE.RECOVER) {
      rawNodes = recoverNodes;
    }

    let exist: INode[] | undefined = _.filter(rawNodes, (n: INode) => n.id === node.id);
    if (!_.isEmpty(exist)) {
      rawNodes = _.map(rawNodes, (n: INode) => {
        if (n.id === node.id) {
          return node;
        }
        return n;
      });
    } else {
      rawNodes = [ ...rawNodes, node ];
    }

    if (node.nodeType === NODE_TYPE.OBSERVER) {
      experiment.observerNodes = rawNodes;
    } else if (node.nodeType === NODE_TYPE.RECOVER) {
      experiment.recoverNodes = rawNodes;
    }

    // ????????????????????????
    exist = undefined;
    exist = _.filter(guards, (n: INode) => n.id === node.id);
    if (!_.isEmpty(exist)) {
      guards = _.map(guards, (n: INode) => {
        if (n.id === node.id) {
          return convertNode(node);
        }
        return n;
      });
    } else {
      guards = [ ...guards, convertNode(node) ];
    }

    _.set(experiment, 'flow.guardConf.guards', guards);
    return {
      ...this.state,
      experiment: {
        ...experiment,
      },
    };
  }

  @reducer
  setExperimentByExpertise(payload: IExperiment, expertiseId: IExpertiseId) {
    let { experiment } = this.state;
    const initExpertise = { ...payload };
    if (_.isEmpty(initExpertise)) {
      return { ...this.state };
    }
    const experimentFlow = _.get(initExpertise, 'flowInfo');
    const baseInfo = _.get(initExpertise, 'basicInfo', {});
    const newExperiment = {
      id: uuidv4(),
      experimentId: initExpertise && initExpertise.experimentId,
      baseInfo: {
        ...baseInfo,
        // ????????????????????????????????????
        description: '',
      },
      flow: {
        ...experimentFlow,
        expertiseId: expertiseId?.expertise_id,
      },
    };

    experiment = initExperimentFlow(newExperiment);

    return {
      ...this.state,
      experiment: {
        ...experiment,
      },
    };
  }

  // ????????????????????????
  @reducer
  setExperimentByAppCode(payload: IExperiment) {
    let { experiment } = this.state;
    if (!_.isEmpty(payload)) {
      const { flowInfo } = payload;
      const mergeExperiment = {
        flow: { ...flowInfo },
        baseInfo: { },
      };
      experiment = initExperimentFlow(mergeExperiment);
    } else {
      const newExperiment = {
        flow: {
          runMode: 'SEQUENCE', // runMode????????????????????????
          duration: 900, // ????????????????????????900???
          schedulerConfig: {
            cronExpression: '',
          },
        },
        baseInfo: {
          name: '',
          description: '',
          tags: [],
          miniAppDesc: [],
          workspaces: [],
          relations: [],
        },
      };
      experiment = initExperimentFlow(newExperiment);
    }

    return {
      ...this.state,
      experiment: {
        ...experiment,
      },
    };
  }

  @reducer
  setCreateExperimentId(payload: string) {
    return {
      ...this.state,
      createExperimentId: payload,
    };
  }

  // editor
  @effect()
  *getExperimentBaseInfo(payload: IExperimentId) {
    return yield this.effects.call(createServiceChaos('QueryExperimentBasicInfo'), payload);
  }

  @effect()
  *getExperiment(payload: IExperimentId, callback: (res: any) => void) {
    const { Data } = yield this.effects.call(createServiceChaos('QueryExperiment'), payload);
    if (Data.flowInfo?.guardConf?.guards) {
      Data.flowInfo.guardConf.guards?.map((item: any) => {
        if (item.actionType === 0) {
          item.arguments = [{
            argumentList: item.arguments,
            gradeName: '??????',
          }];
        }
        return item;
      });
    }
    callback && callback(Data);
    yield this.effects.put(this.setExperiment(Data));
  }

  @effect()
  *getExperimentByExpertise(payload: IExpertiseId) {
    const { Data } = yield this.effects.call(createServiceChaos('InitExperimentByExpertise'), payload);
    if (Data.flowInfo?.guardConf?.guards) {
      Data.flowInfo.guardConf.guards.map((item: any) => {
        if (item.actionType === 0) {
          item.arguments = [{
            argumentList: item.arguments,
            gradeName: '??????',
          }];
        }
        return item;
      });
    }
    yield this.effects.put(this.setExperimentByExpertise(Data, payload));
  }

  @effect()
  *getExperimentByAppCode(payload: IAppCode) {
    const { Data } = yield this.effects.call(createServiceChaos('InitExperimentByAppCode'), payload);
    yield this.effects.put(this.setExperimentByAppCode(Data));
  }

  @effect()
  *createExperiment(payload: any, callback: () => void) {
    payload.definition?.guardConf?.guards?.map((item: any) => {
      if (item.actionType === 0) {
        item.arguments = item.arguments[0].argumentList;
      }
      return item;
    });
    const { Data } = yield this.effects.call(createServiceChaos('CreateExperiment'), payload);
    Data && callback && callback();
    yield this.effects.put(this.setCreateExperimentId(Data));
  }

  @effect()
  *updateExperiment(payload: any, callback: () => void) {
    payload?.guardConf?.guards?.map((item: any) => {
      if (item.actionType === 0) {
        item.arguments = item.arguments[0].argumentList;
      }
      return item;
    });
    const { success } = yield this.effects.call(createServiceChaos('UpdateExperimentFlowDefinition'), payload);
    success && callback && callback();
  }

  @effect()
  *clearExperiment() {
    return {};
  }

  // ????????????????????????
  @effect()
  *workspaceCreateExperiment(payload: any, callback: () => void) {
    payload.definition?.guardConf?.guards?.map((item: any) => {
      if (item.actionType === 0) {
        item.arguments = item.arguments[0].argumentList;
      }
      return item;
    });
    const { Data } = yield this.effects.call(createServiceChaos('workspaceCreateExperiment'), payload);
    Data && callback && callback();
    yield this.effects.put(this.setCreateExperimentId(Data));
  }
}

export default new ExperimentEditor().model;

declare global {
  interface Actions {
    experimentEditor: ExperimentEditor;
  }
}
