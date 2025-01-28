import './App.scss';
import SalarySection from './components/SalarySection/SalarySection.tsx';
import { SalaryProvider } from './providers/SalaryProvider.tsx';
import NavigationBar from './components/NavigationBar/NavigationBar.tsx';

function App() {
  return (
      <>
        <SalaryProvider>
          <NavigationBar></NavigationBar>

          <main className="container-fluid min-w-6xp mx-auto mt-20">
            <section
                className="container-fluid w-full mx-auto my-8 p-8 flex flex-col shadow-xl bg-white bg-opacity-65">
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

            <SalarySection></SalarySection>

          </main>
        </SalaryProvider>
      </>
  );
}

export default App;
