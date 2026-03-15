import { state } from "../store";

const Table = () => {
  return state.meterData.length > 0 && state.headers.length > 0 ? (
    <table>
      <thead>
        <tr>
          {state.headers.map((h) => (
            <th>{h}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {state.meterData.map((row) => (
          <tr>
            {Object.values(row).map((value) => (
              <td>{value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p>{`Loading...`}</p>
  );
};

export default Table;
