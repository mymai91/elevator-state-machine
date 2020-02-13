import React from 'react';
import 'antd/dist/antd.css';
import './App.css';

import { useMachine } from '@xstate/react';
import { Machine, assign } from 'xstate';
import { Button, Card, Radio, Steps } from 'antd';

// https://xstate.js.org/viz/

const { Step } = Steps;

function App() {
  let elevatorTransition = null;
  let currentFloor = null;
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
          on: {
            UP: 'up',
            DOWN: 'down',
          },
        },
        down: {
          // current is down the transition only can up or stop
          on: {
            // UP: 'up',
            // STOP: 'stop',
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
            // DOWN: 'down',
            // STOP: 'stop',
            PRESS_LEVEL: {
              target: 'moving.go_up',
              actions: assign({
                chosenLevel: (context, event) => +event.value,
              }),
            },
          },
        },
        moving: {
          initial: 'reached',
          states: {
            go_up: {
              activities: ['moving_up'],
              on: {
                REACHED: 'reached',
                MOVING: {
                  actions: assign({
                    level: (context, event) => event.value,
                  }),
                },
              },
            },
            go_down: {
              on: {
                REACHED: 'reached',
              },
            },
            wait: {
              on: {
                REACHED: 'reached',
              },
            },
            reached: {
              activities: ['clearElevatorTransition'],
              type: 'final',
            },
          },
        },
      },
    },
    {
      activities: {
        moving_up: () => {
          currentFloor = level;
          elevatorTransition = setInterval(() => {
            currentFloor = currentFloor + 1;
            return send({
              type: 'MOVING',
              value: currentFloor,
            });
          }, 1000);
        },
        clearElevatorTransition: () => {
          send('STOP');
          return () => clearInterval(elevatorTransition);
        },
      },
    },
  );

  const [current, send] = useMachine(elevatorMachine);
  const { level, chosenLevel } = current.context;

  if (current.matches('moving') && level === chosenLevel) {
    send('REACHED');
  }

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

        {current.matches('moving.go_up') && (
          <div>
            <p>Current level {level}</p>
            <p>Moving up to level {chosenLevel}</p>
          </div>
        )}

        {current.matches('moving.reached') && (
          <div>
            <p>Reached level {level}</p>
          </div>
        )}

        {current.matches('up') && <p>Go Up</p>}
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

      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
    </div>
  );
}

export default App;
