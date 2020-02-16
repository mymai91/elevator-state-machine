import React, { useState } from 'react';
import 'antd/dist/antd.css';
import './App.css';

import { useMachine } from '@xstate/react';
import { Machine, assign } from 'xstate';
import { Button, Card, Radio, Steps } from 'antd';

// https://xstate.js.org/viz/

const { Step } = Steps;

function App() {
  const elevatorMachine = Machine(
    {
      id: 'elevator',
      initial: 'stop',
      context: {
        level: 1,
        chosenLevel: 1,
        isError: false,
      },
      states: {
        stop: {
          // current is stop the transition only can up or down
          // entry: 'checkValue',
          on: {
            UP: 'up',
            DOWN: 'down',
          },
        },
        down: {
          // current is down the transition only can up or stop
          on: {
            PRESS_LEVEL: {
              target: 'moving.go_down',
              actions: assign({
                chosenLevel: (context, event) => +event.value,
              }),
              cond: 'pressLevelDownValidate',
            },
            ERROR: {
              actions: assign({
                isError: (context, event) => true,
              }),
            },
          },
        },
        up: {
          // current is up the transition only can down or up
          on: {
            PRESS_LEVEL: {
              target: 'moving.go_up',
              actions: assign({
                chosenLevel: (context, event) => +event.value,
              }),
              cond: 'pressLevelUpValidate',
            },
            ERROR: {
              actions: assign({
                isError: (context, event) => true,
              }),
            },
          },
        },
        moving: {
          initial: 'finished',
          states: {
            go_up: {
              activities: ['moving'],
              // actions: ['moving_up_action'],
              // exit: 'logScreenChange',
              entry: 'reachedLevel',
              on: {
                REACHED: 'reached',
                MOVING: {
                  target: 'go_up',
                  actions: assign({
                    level: (context, event) => event.value + 1,
                  }),
                  cond: {
                    type: 'isMoveUp',
                  },
                },
              },
            },
            go_down: {
              activities: ['moving'],
              entry: 'reachedLevel',
              on: {
                REACHED: 'reached',
                MOVING: {
                  target: 'go_down',
                  actions: assign({
                    level: (_context, event) => event.value - 1,
                  }),
                  cond: {
                    type: 'isMoveDown',
                  },
                },
              },
            },
            reached: {
              after: [
                {
                  delay: 1000,
                  target: 'finished',
                },
              ],
            },
            finished: {
              type: 'final',
            },
          },
          onDone: 'stop',
        },
      },
    },
    {
      actions: {
        reachedLevel: context => {
          const { level, chosenLevel } = context;
          if (level === chosenLevel) {
            send('REACHED');
          }
        },
      },
      activities: {
        moving: (context, _event) => {
          let { level } = context;
          setTimeout(() => {
            return send({
              type: 'MOVING',
              value: level,
            });
          }, 1000);
        },
      },
      guards: {
        pressLevelDownValidate: (context, event, { cond }) => {
          console.log('event', event.value);
          const chosenLevel = event.value;
          const { level } = context;
          if (chosenLevel > level) {
            send('ERROR');
          }
          return chosenLevel < level;
        },
        pressLevelUpValidate: (context, event, { cond }) => {
          console.log('event', event.value);
          const chosenLevel = event.value;
          const { level } = context;
          if (chosenLevel < level) {
            send('ERROR');
          }
          return chosenLevel > level;
        },
        isMoveUp: (context, event, { cond }) => {
          const { level, chosenLevel } = context;

          return level < chosenLevel;
        },
        isMoveDown: (context, event, { cond }) => {
          const { level, chosenLevel } = context;

          return chosenLevel < level;
        },
      },
    },
  );

  const [tmpChosenLevel, setTmpChosenLevel] = useState(null);
  const [current, send] = useMachine(elevatorMachine);
  const { level, chosenLevel, isError } = current.context;

  // console.log('current.value', current.value)
  console.log('current.context outside chosenLevel', chosenLevel);

  const handleGoUp = () => {
    send('UP');
  };

  const handleGoDown = () => {
    send('DOWN');
  };

  const handleChooseLevel = e => {
    setTmpChosenLevel(e.target.value);
    send({
      type: 'PRESS_LEVEL',
      value: e.target.value,
    });
  };

  return (
    <div className="App">
      <div style={{ margin: 50 }}>
        <Button type="primary" onClick={() => handleGoUp()}>
          Up
        </Button>
        <Button type="danger" onClick={() => handleGoDown()}>
          Down
        </Button>
      </div>

      <Card title="Door" style={{ width: 300, margin: '0 auto', marginBottom: 50 }}>
        {current.matches('stop') && (
          <div>
            You are at level {level}
            <p>Door Close</p>
          </div>
        )}

        {current.matches({ moving: 'go_up' }) && (
          <div>
            <p>Current level {level}</p>
            <p>Moving up to level {chosenLevel}</p>
          </div>
        )}

        {current.matches({ moving: 'go_down' }) && (
          <div>
            <p>Current level {level}</p>
            <p>Moving down to level {chosenLevel}</p>
          </div>
        )}

        {current.matches({ moving: 'reached' }) && (
          <div>
            <p>Reached level {level}</p>
          </div>
        )}

        {current.matches('up') && (
          <div>
            {isError ? (
              <div>
                You are at level {level}
                <p>Can not go up to level {tmpChosenLevel}</p>
              </div>
            ) : (
              <div>
                <p>Press Go Up</p>
                <p>Door opened</p>
                <p>Please Press Level</p>
              </div>
            )}
          </div>
        )}

        {current.matches('down') && (
          <div>
            {isError ? (
              <div>
                You are at level {level}
                <p>Can not go down to level {tmpChosenLevel}</p>
              </div>
            ) : (
              <div>
                <p>Press Go Down</p>
                <p>Door opened</p>
                <p>Please Press Level</p>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card title="Elevator" style={{ width: 300, margin: '0 auto' }}>
        <Radio.Group defaultValue="1" buttonStyle="solid" onChange={e => handleChooseLevel(e)}>
          <Radio.Button value="1">1</Radio.Button>
          <Radio.Button value="2">2</Radio.Button>
          <Radio.Button value="3">3</Radio.Button>
          <Radio.Button value="4">4</Radio.Button>
          <Radio.Button value="5">5</Radio.Button>
        </Radio.Group>
        <div style={{ marginTop: 50 }}>
          <Steps direction="vertical" size="small" current={level - 1}>
            <Step title="Level 1" description="This is a description." />
            <Step title="Level 2" description="This is a description." />
            <Step title="Level 3" description="This is a description." />
            <Step title="Level 4" description="This is a description." />
            <Step title="Level 5" description="This is a description." />
          </Steps>
        </div>
      </Card>
    </div>
  );
}

export default App;
