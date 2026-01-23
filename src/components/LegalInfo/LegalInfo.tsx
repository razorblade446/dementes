import { UVT, UVT_LIMIT, UVT_LIMIT_EXEMPTION } from '../../constants/constants.ts';
import { financial } from '../../utils/utils.ts';

export function LegalInfo() {
  return (
      <section
          className="flex flex-col flex-wrap justify-between p-8 shadow-xl bg-white bg-opacity-65">
        <h2>Valores importantes a tener en cuenta para año 2026</h2>
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
            <td className="text-center p-2">{ financial(UVT) }</td>
            <td className="text-center p-2">{ UVT_LIMIT }</td>
            <td className="text-center p-2">{ financial(UVT_LIMIT_EXEMPTION ) }</td>
          </tr>
          </tbody>
        </table>
      </section>
  );
}