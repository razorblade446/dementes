import './App.scss';
import SalarySection from './components/SalarySection/SalarySection.tsx';
import { SalaryProvider } from './providers/SalaryProvider.tsx';

function App() {
  return (
      <>
        <header className="container w-full my-8 px-8 shadow-xl rounded-xl bg-white bg-opacity-65">
          <h1>Calculadora de Ingresos Reales</h1>
        </header>
        <section className="container my-8 p-8 flex flex-col shadow-xl bg-white bg-opacity-65 rounded-xl">
          <h2>Valores importantes a tener en cuenta para año 2025</h2>
          <table className="table-auto rounded-xl shadow-xl bg-orange-500 overflow-hidden">
            <thead>
            <tr className="border-b-[1px] border-gray-700 text-white">
              <th scope="col">Valor UVT</th>
              <th scope="col">Tope Excepción 25% en UVTs</th>
              <th scope="col">Tope Excepcion 25% en Pesos</th>
            </tr>
            </thead>
            <tbody className="rounded-b-xl [&>tr]:border-b-[1px] [&>tr:last-child()]:border-none">
            <tr className="bg-orange-50">
              <td className="text-center">$ 49.799</td>
              <td className="text-center">790</td>
              <td className="text-center">$ 39.341.210</td>
            </tr>
            </tbody>
          </table>
        </section>

        <SalaryProvider>
          <SalarySection></SalarySection>
        </SalaryProvider>
      </>
  );
}

export default App;
