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

import { Box, Flex } from "@chakra-ui/react";
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

type TextInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function TextInput({ label, value, onChange }: TextInputProps) {
  return (
    <div className="p-4">
      <label htmlFor="input" className="block text-sm font-medium mb-2">
        {label}
      </label>
      <input
        id="input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded p-2 w-full"
        placeholder="Type here..."
      />
    </div>
  );
}

function App() {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    TempCategory | "All"
  >("All");
  const [minTempValue, setMinTempValue] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newTemp, setNewTemp] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onMinTempChange = (text: string) => {
    console.log(text.trim());
    setMinTempValue(text.trim());
  };

  const onNewCityChange = (text: string) => {
    console.log(text.trim());
    setNewCity(text.trim());
  };

  const onNewTempChange = (text: string) => {
    console.log(text.trim());
    setNewTemp(text.trim());
  };

  const fetchCities = () => {
    fetch(
      "http://localhost:8000/cities?min=" + (minTempValue! ? minTempValue : 0)
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setCities(data);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setError(err);
        setLoading(false);
      });
  };

  const addNewCityAndTemp = (city: string, temp: string) => {
    if (city == "" || temp == "") {
      return;
    }

    const dataToSend = {
      city: city,
      temp: +temp,
    };

    fetch("http://localhost:8000/cities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log(data);
        fetchCities();
      })
      .catch((err) => {
        console.log(err);
      });
  };

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
    fetchCities();
  }, [minTempValue]);

  return (
    <Flex
      width={{ base: "100%", md: "full" }}
      direction={"column"}
      style={{ padding: "1rem" }}
    >
      {loading && <p>Loading cities...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {!loading && !error && cities.length === 0 && <p>No cities found.</p>}
      <Flex
        justifyContent={"center"}
        direction={"row"}
        style={{ padding: "1rem" }}
      >
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
      </Flex>
      <TextInput
        label={"Minimum temperature:"}
        value={minTempValue}
        onChange={onMinTempChange}
      />
      <Flex
        align={"center"}
        justifyContent={"space-between"}
        paddingTop={"12px"}
      >
        <TextInput
          label={"New city:"}
          value={newCity}
          onChange={onNewCityChange}
        />
        <TextInput
          label={"New temp:"}
          value={newTemp}
          onChange={onNewTempChange}
        />
        <button
          key={"addNewCityAndTemp"}
          onClick={() => addNewCityAndTemp(newCity, newTemp)}
          style={{
            marginRight: "0.5rem",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          +Add City And Temp
        </button>
      </Flex>

      <h1>🌤️ City Temperature Dashboard</h1>
      {orderedCategories
        .filter((cat) => filtered[cat])
        .map((category) => (
          <Box
            marginTop={"8"}
            key={category}
            bg={
              category === "Hot"
                ? "lightcoral"
                : category === "Cool"
                ? "lightblue"
                : "lemonchiffon"
            }
            p="4"
            borderRadius="md"
            mb="4"
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
              {avgTemp(filtered[category].map(({ temp }) => temp))})
            </h2>
            <ul>
              {filtered[category].map((ci, idx) => (
                <li key={ci.city + idx}>{ci.city}</li>
              ))}
            </ul>
          </Box>
        ))}
      <Bar data={chartData} options={chartOptions} />
    </Flex>
  );
}

export default App;
