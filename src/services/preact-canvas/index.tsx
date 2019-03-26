/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Remote } from "comlink/src/comlink.js";
import { Component, h, render } from "preact";
import { Cell, GridChanges } from "../../gamelogic/types.js";
import StateService, { State as GameState, StateName } from "../state/index.js";
import localStateSubscribe from "../state/local-state-subscribe.js";
import End from "./components/end/index.js";
import Game from "./components/game/index.js";

interface Props {
  stateService: Remote<StateService>;
}

interface State {
  state: GameState;
}

export type GridChangeSubscriptionCallback = (gridChanges: GridChanges) => void;

class PreactService extends Component<Props, State> {
  state: State = {} as any;

  private gridChangeSubscribers = new Set<GridChangeSubscriptionCallback>();

  constructor(props: Props) {
    super(props);

    localStateSubscribe(props.stateService, (newState, gridChanges) => {
      if (gridChanges) {
        this.gridChangeSubscribers.forEach(f => f(gridChanges));
      }
      this.setState({ state: newState });
    });
  }

  render({ stateService }: Props, { state }: State) {
    if (!state || !("name" in state)) {
      return <div />;
    }
    switch (state.name) {
      case StateName.START:
        return (
          <button onClick={() => stateService.initGame(40, 40, 160)}>
            Let’s play! (There should be a config dialog here, but alas, it is
            not.)
          </button>
        );
      case StateName.WAITING_TO_PLAY:
      case StateName.PLAYING:
        return (
          // TODO: Implement an unsubscribe for when the unmounting happens
          <Game
            grid={state.grid}
            gridChangeSubscribe={(f: GridChangeSubscriptionCallback) =>
              this.gridChangeSubscribers.add(f)
            }
            stateService={stateService}
          />
        );
      case StateName.END:
        return (
          <End type={state.endType} restart={() => stateService.reset()} />
        );
    }
  }
}

export function game(stateService: Remote<StateService>) {
  render(<PreactService stateService={stateService} />, document.body, document
    .body.firstChild as any);
}
