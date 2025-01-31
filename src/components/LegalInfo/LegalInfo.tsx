export function LegalInfo() {
  return (
      <section
          className="max-w-screen-xl w-full flex flex-col flex-wrap justify-between p-8 shadow-xl bg-white bg-opacity-65">
        <h2>Valores importantes a tener en cuenta para año 2025</h2>
        <table className="table-auto shadow-xl bg-orange-50">
          <thead>
          <tr className="border-b-[1px] border-gray-700 text-orange-500">
            <th scope="col" className="text-center p-2">Valor UVT</th>
            <th scope="col" className="text-center p-2">Tope Excepción 25% en UVTs</th>
            <th scope="col" className="text-center p-2">Tope Excepcion 25% en Pesos</th>
          </tr>
          </thead>
          <tbody className="rounded-b-xl border-b-[1px] last:border-none">
          <tr className="bg-white">
            <td className="text-center p-2">$ 49.799</td>
            <td className="text-center p-2">790</td>
            <td className="text-center p-2">$ 39.341.210</td>
          </tr>
          </tbody>
        </table>
      </section>
  );
}