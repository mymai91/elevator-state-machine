import React from 'react';
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
                level: (context, event) => event.value,
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
            },
          },
        },
        moving: {
          initial: 'finished',
          states: {
            go_up: {
              activities: ['moving_up'],
              // actions: ['moving_up_action'],
              // exit: 'logScreenChange',
              // entry: 'movingUpAction',
              on: {
                REACHED: 'reached',
                MOVING: {
                  target: 'go_up',
                  actions: assign({
                    level: (context, event) => event.value + 1,
                  }),
                  cond: {
                    type: 'movingUpValidate',
                  },
                },
              },
            },
            go_down: {
              on: {
                REACHED: 'reached',
              },
            },
            // wait: {
            //   on: {
            //     REACHED: 'reached',
            //   },
            // },
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
        checkValue: context => {
          console.log('checkValue context', context);
        },
        assignFullValue: assign((context, event) => {
          // console.log('assignFullValue event', event);
        }),
        stop_moving: () => {
          console.log('stop====');
          send('STOP');
        },
        movingUpAction: context => {
          // currentFloor = level;
          // console.log('checkValue context===', context);
          // console.log('current.context inside', current.context);
          // elevatorTransition = setInterval(() => {
          //   currentFloor = currentFloor + 1;
          //   return send({
          //     type: 'MOVING',
          //     value: currentFloor,
          //   });
          // }, 1000);
        },
      },
      activities: {
        moving_up: (context, _event) => {
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
        movingUpValidate: (context, event, { cond }) => {
          const { level, chosenLevel } = context;
          if (level === chosenLevel) {
            send('REACHED');
          }
          return level < chosenLevel;
        },
      },
    },
  );

  const [current, send] = useMachine(elevatorMachine);
  const { level, chosenLevel } = current.context;

  // console.log('current.value', current.value)
  // console.log('current.context outside', current.context);

  const handleGoUp = () => {
    send('UP');
  };

  const handleGoDown = () => {
    send('DOWN');
  };

  const handleChooseLevel = e => {
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

        {current.matches({ moving: 'reached' }) && (
          <div>
            <p>Reached level {level}</p>
          </div>
        )}

        {current.matches('up') && (
          <div>
            <p>Go Up</p>
            <p>Door opened</p>
            <p>Please Press Level</p>
          </div>
        )}
        {current.matches('down') && <p>Go Down</p>}
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
