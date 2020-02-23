import React, { useState } from 'react';
import 'antd/dist/antd.css';
import './App.css';

import { useMachine } from '@xstate/react';
import { Machine, assign } from 'xstate';
import { Icon, Card, Radio, Row, Col, Layout } from 'antd';

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
        isDisablePressLevelBtn: true,
        doorStatus: 'close',
      },
      states: {
        stop: {
          // current is stop the transition only can up or down
          on: {
            UP: {
              target: 'up',
              actions: assign({
                direction: (context, event) => 'up',
                isDisablePressLevelBtn: false,
                doorStatus: 'open',
              }),
            },
            DOWN: {
              target: 'down',
              actions: assign({
                direction: (context, event) => 'down',
                isDisablePressLevelBtn: false,
                doorStatus: 'open',
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
                  doorStatus: 'close',
                }),
              },
              {
                target: 'error.go_down',
                actions: assign({
                  chosenLevel: (context, event) => +event.value,
                  doorStatus: 'close',
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
                  doorStatus: 'close',
                }),
              },
              {
                target: 'error.go_up',
                actions: assign({
                  chosenLevel: (context, event) => +event.value,
                  doorStatus: 'close',
                }),
              },
            ],
          },
        },
        error: {
          states: {
            go_up: {
              entry: 'errorPressDirection',

              on: {
                REACHED: {
                  target: '#elevator_moving.go_down',
                  actions: assign({
                    direction: (context, event) => 'down',
                  }),
                },
              },
            },
            go_down: {
              entry: 'errorPressDirection',

              on: {
                REACHED: {
                  target: '#elevator_moving.go_up',
                  actions: assign({
                    direction: (context, event) => 'up',
                  }),
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
                  actions: assign({
                    doorStatus: 'open',
                  }),
                },
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
          onDone: {
            target: 'stop',
            actions: assign({
              direction: (_context, _event) => '',
              isDisablePressLevelBtn: true,
              doorStatus: 'close',
            }),
          },
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
        errorPressDirection: context => {
          setTimeout(() => {
            return send('REACHED');
          }, 1000);
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
  const { level, chosenLevel, direction, isDisablePressLevelBtn, doorStatus } = current.context;

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
      <Row type="flex" justify="center" align="middle">
        <Col span={8} offset={2}>
          <div className="notification">
            <h2 style={{ color: '#333', fontSize: 32 }}>Elevator</h2>
            <div>
              {current.matches('stop') && (
                <div>
                  <p>You are at level {level}</p>
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
            </div>
          </div>
        </Col>
      </Row>
      <Row type="flex" justify="center" align="middle">
        <Col span={2}>
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
        </Col>
        <Col span={8}>
          <div className="elevator">
            <div className="">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={12}>
                  <div>
                    <div className="direction-wrapper">
                      {current.matches({ moving: 'go_down' }) && (
                        <div className="direction-container">
                          <div className="chevron chevron-down"></div>
                          <div className="chevron chevron-down"></div>
                          <div className="chevron chevron-down"></div>
                        </div>
                      )}

                      {current.matches({ moving: 'go_up' }) && (
                        <div className="direction-container">
                          <div className="chevron chevron-up"></div>
                          <div className="chevron chevron-up"></div>
                          <div className="chevron chevron-up"></div>
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: 60, margin: 0 }}>{level}</p>
                  </div>
                </Col>
              </Row>
            </div>
            <div className="stage">
              <div className="stage-content" style={{ height: 500 }}>
                <Radio.Group
                  className="state-group-button"
                  defaultValue="1"
                  buttonStyle="solid"
                  onChange={e => handleChooseLevel(e)}
                  disabled={isDisablePressLevelBtn}
                >
                  <Radio.Button style={radioStyle} value="5">
                    5
                  </Radio.Button>
                  <Radio.Button style={radioStyle} value="4">
                    4
                  </Radio.Button>
                  <Radio.Button style={radioStyle} value="3">
                    3
                  </Radio.Button>
                  <Radio.Button style={radioStyle} value="2">
                    2
                  </Radio.Button>
                  <Radio.Button style={radioStyle} value="1">
                    1
                  </Radio.Button>
                </Radio.Group>
              </div>
              <label className={`${doorStatus} curtain-container`}>
                <div className="curtain-panel">
                  <div className={`${doorStatus} left-curtain curtain`}></div>
                  <div className={`${doorStatus} right-curtain curtain`}></div>
                </div>
              </label>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default App;
