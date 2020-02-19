import React, { useState } from 'react';
import 'antd/dist/antd.css';
import './App.css';

import { useMachine } from '@xstate/react';
import { Machine, assign, sendParent } from 'xstate';
import { Icon, Card, Radio } from 'antd';

// https://xstate.js.org/viz/

function App() {
  const elevatorMachine = Machine(
    {
      id: 'elevator',
      initial: 'stop',
      context: {
        level: 1,
        chosenLevel: 1,
        direction: '',
      },
      states: {
        stop: {
          // current is stop the transition only can up or down
          // entry: 'checkValue',
          on: {
            UP: {
              target: 'up',
              actions: assign({
                direction: (context, event) => 'up',
              }),
            },
            DOWN: {
              target: 'down',
              actions: assign({
                direction: (context, event) => 'down',
              }),
            },
          },
        },
        down: {
          // current is down the transition only can up or stop
          id: 'elevator_down',
          on: {
            PRESS_LEVEL: [
              {
                target: 'moving.go_down',
                cond: 'pressLevelDownValidate',
                actions: assign({
                  chosenLevel: (context, event) => +event.value,
                }),
              },
              {
                target: 'error.go_down',
                actions: assign({
                  chosenLevel: (context, event) => +event.value,
                }),
              },
            ],
          },
        },
        up: {
          // current is up the transition only can down or up
          id: 'elevator_up',
          on: {
            PRESS_LEVEL: [
              {
                target: 'moving.go_up',
                cond: 'pressLevelUpValidate',
                actions: assign({
                  chosenLevel: (context, event) => +event.value,
                }),
              },
              {
                target: 'error.go_up',
                actions: assign({
                  chosenLevel: (context, event) => +event.value,
                }),
              },
            ],
          },
        },
        error: {
          states: {
            go_up: {
              entry: 'errorGoUp',

              on: {
                REACHED: {
                  target: '#elevator_moving.go_down',
                },
              },
            },
            go_down: {
              entry: 'errorGoDown',

              on: {
                REACHED: {
                  target: '#elevator_moving.go_up',
                },
              },
            },
          },
        },
        moving: {
          id: 'elevator_moving',
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
        errorGoUp: context => {
          console.log('errorGoUp');
          send('REACHED');
        },
        errorGoDown: context => {
          console.log('errorGoDown');
          send('REACHED');
        },
      },
      activities: {
        moving: (context, _event) => {
          console.log('MOVING');
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
          const chosenLevel = event.value;
          const { level } = context;

          return chosenLevel < level;
        },
        pressLevelUpValidate: (context, event, { cond }) => {
          const chosenLevel = event.value;
          const { level } = context;

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
  const { level, chosenLevel, direction } = current.context;

  // console.log('current.value', current.value)
  console.log('current.context outside direction', current.context);

  const handlePressUpDown = e => {
    if (e.target.value === 'up') {
      send('UP');
    } else {
      send('DOWN');
    }
  };

  const handleChooseLevel = e => {
    setTmpChosenLevel(e.target.value);
    send({
      type: 'PRESS_LEVEL',
      value: e.target.value,
    });
  };

  const radioStyle = {
    display: 'block',
    height: '30px',
    lineHeight: '30px',
  };

  return (
    <div className="App">
      <div style={{ margin: 50 }}>
        <Radio.Group
          value={direction}
          onChange={e => handlePressUpDown(e)}
          className="pressUpDownBtn"
        >
          <Radio.Button className="radioOpenDoorStyle" value="up">
            <Icon type="up-circle" style={{ fontSize: '30px', color: '#08c' }} />
          </Radio.Button>
          <Radio.Button className="radioOpenDoorStyle" value="down">
            <Icon type="down-circle" style={{ fontSize: '30px', color: '#08c' }} />
          </Radio.Button>
        </Radio.Group>
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
            <h3>Going Up</h3>
            <p>Current level {level}</p>
            <p>Moving up to level {chosenLevel}</p>
          </div>
        )}

        {current.matches({ moving: 'go_down' }) && (
          <div>
            <h3>Going Down</h3>
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
            <p>Press Go Up</p>
            <p>Door opened</p>
            <p>Please Press Level</p>
          </div>
        )}

        {current.matches('down') && (
          <div>
            <p>Press Go Down</p>
            <p>Door opened</p>
            <p>Please Press Level</p>
          </div>
        )}

        {current.matches('error.go_up') && (
          <div>
            <h2>ERROR</h2>
            You are at level {level}
            <p>Can not go up to level {tmpChosenLevel}</p>
          </div>
        )}

        {current.matches('error.go_down') && (
          <div>
            <h2>ERROR</h2>
            You are at level {level}
            <p>Can not go down to level {tmpChosenLevel}</p>
          </div>
        )}
      </Card>

      <Card title="Elevator" style={{ width: 300, margin: '0 auto' }}>
        <div>
          <div style={{ marginTop: 50 }}>
            <p style={{ fontSize: 70 }}>{level}</p>
          </div>
          <div style={{ width: 100 }}>
            <Radio.Group defaultValue="1" buttonStyle="solid" onChange={e => handleChooseLevel(e)}>
              <Radio.Button style={radioStyle} value="1">
                1
              </Radio.Button>
              <Radio.Button style={radioStyle} value="2">
                2
              </Radio.Button>
              <Radio.Button style={radioStyle} value="3">
                3
              </Radio.Button>
              <Radio.Button style={radioStyle} value="4">
                4
              </Radio.Button>
              <Radio.Button style={radioStyle} value="5">
                5
              </Radio.Button>
            </Radio.Group>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default App;
