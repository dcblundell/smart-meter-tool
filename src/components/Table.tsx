import { For, Show } from 'solid-js';
import { state } from '../store';

const Table = () => {
  return (
    <Show
      when={state?.meterData && state.meterData.length > 0 && state.headers.length > 0}
      fallback={<p>{`Loading...`}</p>}
    >
      <table>
        <thead>
          <tr>
            <For each={state.headers}>{(h) => <th>{h}</th>}</For>
          </tr>
        </thead>

        <tbody>
          <For each={state?.meterData}>{(row) => <tr><For each={Object.values(row)}>{(value) => <td>{value}</td>}</For></tr>}</For>
        </tbody>
      </table>
    </Show>
  );
};

export default Table;
