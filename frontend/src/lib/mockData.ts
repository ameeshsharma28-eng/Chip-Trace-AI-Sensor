export type Supplier = {
  id: string;
  name: string;
  score: number;
  defectRate: number;
  avgDelayDays: number;
  reliability: string;
  location: string;
};

export const suppliers: Supplier[] = [
  { id: "SUP-01", name: "Alpha Semiconductor Materials", score: 94, defectRate: 1.2, avgDelayDays: 0.5, reliability: "HIGH", location: "Taiwan" },
  { id: "SUP-02", name: "Global Wafer Co.", score: 82, defectRate: 3.1, avgDelayDays: 2.1, reliability: "MEDIUM", location: "South Korea" },
  { id: "SUP-03", name: "NexGen Components", score: 65, defectRate: 5.4, avgDelayDays: 4.5, reliability: "LOW", location: "Malaysia" },
  { id: "SUP-04", name: "Silicon Base Inc", score: 98, defectRate: 0.5, avgDelayDays: 0.1, reliability: "VERY HIGH", location: "Japan" },
];

export type Batch = {
  id: string;
  chipType: string;
  quantity: number;
  productionDate: string;
  status: "In Transit" | "Fabrication" | "Testing" | "Warehouse" | "Delivered";
  qualityStatus: "PASS" | "FAIL" | "PENDING";
  supplierId: string;
  customerId: string;
  eta: string | null;
  currentStage: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
};

export const batches: Batch[] = [
  {
    id: "BATCH-2026-004821",
    chipType: "MCU-AX45",
    quantity: 12500,
    productionDate: "2026-08-25",
    status: "In Transit",
    qualityStatus: "PASS",
    supplierId: "SUP-01",
    customerId: "CUST-99",
    eta: "2026-09-06",
    currentStage: 6, // 1: Raw, 2: Fab, 3: Wafer Test, 4: Packaging, 5: Final Test, 6: Warehouse, 7: Shipping, 8: Customer
    riskLevel: "HIGH",
  },
  {
    id: "BATCH-2026-004822",
    chipType: "POWER-MOS-22",
    quantity: 50000,
    productionDate: "2026-08-28",
    status: "Fabrication",
    qualityStatus: "PENDING",
    supplierId: "SUP-02",
    customerId: "CUST-102",
    eta: "2026-09-15",
    currentStage: 2,
    riskLevel: "LOW",
  },
  {
    id: "BATCH-2026-004823",
    chipType: "SENSOR-IMU7",
    quantity: 8000,
    productionDate: "2026-08-10",
    status: "Delivered",
    qualityStatus: "FAIL",
    supplierId: "SUP-03",
    customerId: "CUST-45",
    eta: null,
    currentStage: 8,
    riskLevel: "LOW", // already delivered
  }
];

export type Shipment = {
  id: string;
  batchId: string;
  origin: string;
  destination: string;
  currentLocation: string;
  carrier: string;
  eta: string;
  predictedEta: string;
  temperature: number;
  humidity: number;
  status: "On Time" | "Delayed" | "At Risk" | "Delivered";
  delayProbability: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  delayReason: string | null;
  lat: number;
  lng: number;
};

export const shipments: Shipment[] = [
  {
    id: "SHIP-88231",
    batchId: "BATCH-2026-004821",
    origin: "Singapore",
    destination: "Germany",
    currentLocation: "Suez Canal",
    carrier: "Global Logistics Ltd",
    eta: "2026-09-04",
    predictedEta: "2026-09-06",
    temperature: 22.5,
    humidity: 45,
    status: "At Risk",
    delayProbability: 78,
    risk: "HIGH",
    delayReason: "Port congestion + customs delay",
    lat: 27.5, // Approx Suez
    lng: 33.8,
  }
];

export type InventoryItem = {
  sku: string;
  name: string;
  currentStock: number;
  reserved: number;
  incoming: number;
  predictedDemand30d: number;
  stockoutProbability: number;
  recommendation: string;
};

export const inventory: InventoryItem[] = [
  {
    sku: "MCU-AX45",
    name: "Microcontroller Unit AX45",
    currentStock: 82450,
    reserved: 75000,
    incoming: 12500,
    predictedDemand30d: 90000,
    stockoutProbability: 85,
    recommendation: "Reorder within 5 days",
  },
  {
    sku: "SENSOR-IMU7",
    name: "6-axis IMU Sensor",
    currentStock: 240000,
    reserved: 100000,
    incoming: 50000,
    predictedDemand30d: 120000,
    stockoutProbability: 12,
    recommendation: "Stock levels optimal",
  }
];
