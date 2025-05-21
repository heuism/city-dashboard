import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";

import "./App.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type TempCategory = "Hot" | "Warm" | "Cool";

interface City {
  city: string;
  temp: number;
}

const orderedCategories: TempCategory[] = ["Hot", "Warm", "Cool"];

const emojiMap: Record<TempCategory, string> = {
  Hot: "🔥",
  Warm: "☀️",
  Cool: "❄️",
};

function categorize(temp: number): TempCategory {
  if (temp >= 30) return "Hot";
  if (temp >= 20) return "Warm";
  return "Cool";
}

function avgTemp(temps: number[]): number {
  return Math.round(temps.reduce((acc, curr) => acc + curr) / temps.length);
}

function App() {
  const [cities, setCities] = useState<City[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<
    TempCategory | "All"
  >("All");

  const grouped: Record<TempCategory, City[]> = cities.reduce((acc, curr) => {
    const cat = categorize(curr.temp);
    acc[cat] = [...(acc[cat] || []), curr];
    return acc;
  }, {} as Record<TempCategory, City[]>);

  const filtered =
    selectedCategory == "All"
      ? grouped
      : { [selectedCategory]: grouped[selectedCategory] };
  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Average Temperature by Category 🌡️",
        font: {
          size: 18,
        },
      },
      legend: {
        display: true,
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.raw}°C`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Temperature (°C)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Category",
        },
      },
    },
  };

  const chartData = {
    labels: orderedCategories.filter((cat) => filtered[cat]),
    datasets: [
      {
        label: "Average Temp",
        data: orderedCategories
          .filter((cat) => filtered[cat])
          .map((cat) => avgTemp(filtered[cat].map(({ temp }) => temp))),
        backgroundColor:
          selectedCategory === "All"
            ? ["red", "orange", "blue"]
            : [
                selectedCategory === "Hot"
                  ? "red"
                  : selectedCategory === "Warm"
                  ? "orange"
                  : "blue",
              ],
      },
    ],
  };

  useEffect(() => {
    fetch("/cities.json")
      .then((res) => res.json())
      .then((data) => setCities(data));
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      {["All", "Hot", "Warm", "Cool"].map((cat) => (
        <button
          key={cat}
          onClick={() => setSelectedCategory(cat as TempCategory | "All")}
          style={{
            marginRight: "0.5rem",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "4px",
            backgroundColor: selectedCategory === cat ? "#333" : "#eee",
            color: selectedCategory === cat ? "white" : "black",
            cursor: "pointer",
          }}
        >
          {cat}
        </button>
      ))}
      <h1>🌤️ City Temperature Dashboard</h1>
      {orderedCategories
        .filter((cat) => filtered[cat])
        .map((category) => (
          <div
            key={category}
            style={{
              backgroundColor:
                category === "Hot"
                  ? "lightcoral"
                  : category === "Cool"
                  ? "lightblue"
                  : "lemonchiffon",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
            }}
          >
            <h2
              style={{
                color:
                  category == "Hot"
                    ? "red"
                    : category == "Warm"
                    ? "orange"
                    : "blue",
              }}
            >
              {emojiMap[category as TempCategory]}
              {category} (Average Temperature:{" "}
              {avgTemp(cities.map(({ temp }) => temp))})
            </h2>
            <ul>
              {filtered[category].map((ci, idx) => (
                <li key={ci.city + idx}>{ci.city}</li>
              ))}
            </ul>
          </div>
        ))}
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}

export default App;
