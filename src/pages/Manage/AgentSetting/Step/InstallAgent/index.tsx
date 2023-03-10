import BottomBtn from './BottomBtn';
import React, { FC, memo, useEffect, useState } from 'react';
import SettingChaosAgent from './SettingChaosAgent';
import SettingSelectEnv from './SettingSelectEnv';
import SettingStep from './SettingStep';
import Translation from 'components/Translation';
import styles from './index.css';
import { Icon } from '@alicloud/console-components';
// import { pushUrl /* , removeParams */ } from 'utils/libs/sre-utils';
import { useDispatch } from 'utils/libs/sre-utils-dva';
import { useHistory } from 'dva';

const ECS = 'ecs';
const InstallAgent: FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const [ step, setStep ] = useState<number>(0);
  const [ installMode, setInstallMode ] = useState<string>(ECS); // 安装模块

  useEffect(() => {
    dispatch.pageHeader.setTitle('');
    dispatch.pageHeader.showBackArrow(false);
  }, []);

  // 步骤条
  const handlePrevOrNextStep = (isNext: boolean) => {
    const _step = isNext ? step + 1 : step - 1;
    setStep(_step);
  };
  // 完成
  const handleComplete = () => {
    /*
    const { pathname } = location || '';
    if (/\/chaos\/agentmanage/.test(pathname)) {
      pushUrl(history, '/chaos/experiment/scope/control');
    } else {
      pushUrl(history, pathname.replace('/step', ''));
    }
    removeParams('iis');
    */
    console.log(history);
  };

  // 选择步骤
  const handleSelectStep = (idx: number) => {
    if (idx < step) {
      setStep(idx);
    }
  };

  // 选择环境
  const handleSelectEnv = (mode: string) => {
    setInstallMode(mode);
    setStep(1);
  };

  function handleBackArrowClick() {
    /*
    const { pathname } = location || '';
    if (/\/chaos\/agentmanage/.test(pathname)) {
      pushUrl(history, '/chaos/experiment/scope/control');
    } else {
      pushUrl(history, pathname.replace('/step', ''));
    }*/
  }

  return (
    <>
      <div className={styles.headTop} onClick={() => handleBackArrowClick()}>
        <Icon type="arrow-alt-left" />
        &nbsp;
        <span className={styles.protectionAccess}>
          <Translation>Install the probe</Translation>
        </span>
      </div>
      <SettingStep
        step={step}
        handleSelectStep={handleSelectStep}
      />
      {step === 0 && (
        <SettingSelectEnv
          enable={true}
          handleSelectEnv={handleSelectEnv}
        />
      )}
      {step === 1 && (
        <SettingChaosAgent
          installMode={installMode}
        />
      )}
      <BottomBtn
        step={step}
        handleComplete={handleComplete}
        handlePrevOrNextStep={handlePrevOrNextStep}
      />
    </>
  );
};

export default memo(InstallAgent);
