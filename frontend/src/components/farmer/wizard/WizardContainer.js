import React, { useState } from 'react';
import StepLocation from './StepLocation';
import StepSoil from './StepSoil';
import StepResults from './StepResults';

const WizardContainer = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({});
  const [result, setResult] = useState(null);

  const next = (patch) => {
    setForm(prev => ({ ...prev, ...patch }));
    setStep(s => s + 1);
  };

  const back = () => setStep(s => Math.max(1, s - 1));

  return (
    <div>
      {step === 1 && <StepLocation onNext={next} initial={form} />}
      {step === 2 && <StepSoil onNext={next} onBack={back} initial={form} />}
      {step === 3 && <StepResults input={form} onBack={back} />}
    </div>
  );
};

export default WizardContainer;
