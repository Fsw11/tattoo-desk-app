 "use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type DatoGrafica = {
  mes: string;
  ingresos: number;
  gastos: number;
};

export default function DashboardChart({
  datos,
}: {
  datos: DatoGrafica[];
}) {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datos}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            opacity={0.2}
          />

          <XAxis
            dataKey="mes"
            fontSize={12}
          />

          <YAxis
            fontSize={12}
            tickFormatter={(valor) =>
              `$${Number(valor).toLocaleString("es-MX")}`
            }
          />

          <Tooltip
            formatter={(valor) =>
              `$${Number(valor).toLocaleString(
                "es-MX",
                {
                  minimumFractionDigits: 2,
                }
              )}`
            }
          />

          <Legend />

          <Bar
            dataKey="ingresos"
            name="Ingresos"
            fill="var(--color-principal)"
            radius={[6, 6, 0, 0]}
          />

          <Bar
            dataKey="gastos"
            name="Gastos"
            fill="#ef4444"
            radius={[6, 6, 0, 0]}
          />

        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
