const API_BASE_URL = "http://localhost:5000/api";

export const getMLPrediction = async () => {
  const response = await fetch(`${API_BASE_URL}/trends/ml-predict`);
  return response.json();
};

export const getTopTrendingBooks = async () => {
  const response = await fetch(`${API_BASE_URL}/trends/top`);
  return response.json();
};

export const getRestockRecommendations = async () => {
  const response = await fetch(`${API_BASE_URL}/inventory/recommendations/restock`);
  return response.json();
};

// Branch summary (3 landing cards)
export const getBranchSummary = async () => {
  const response = await fetch(`${API_BASE_URL}/branches/summary`);
  return response.json();
};

// Single branch info (name etc.)
export const getBranchById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/branches/${id}`);
  return response.json();
};

// Branch detail: top trending books, stock, sales for one branch
export const getBranchTrendDetail = async (branchId) => {
  const response = await fetch(`${API_BASE_URL}/trends/branch/${branchId}`);
  return response.json();
};

// Monthly sales history for one book at one branch (for the sales trend chart)
export const getBookMonthlySales = async (branchId, bookId) => {
  const response = await fetch(
    `${API_BASE_URL}/trends/branch/${branchId}/book/${bookId}/monthly`
  );
  return response.json();
};

// Books
export const getBooks = async () => {
  const response = await fetch(`${API_BASE_URL}/books`);
  return response.json();
};

export const addBook = async (book) => {
  const response = await fetch(`${API_BASE_URL}/books`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(book),
  });

  return response.json();
};

export const deleteBook = async (id) => {
  const response = await fetch(`${API_BASE_URL}/books/${id}`, {
    method: "DELETE",
  });

  return response.json();
};

export const updateBook = async (id, book) => {
  const response = await fetch(`${API_BASE_URL}/books/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(book),
  });

  return response.json();
};

// Branches
export const getBranches = async () => {
  const response = await fetch(`${API_BASE_URL}/branches`);
  return response.json();
};

export const addBranch = async (branch) => {
  const response = await fetch(`${API_BASE_URL}/branches`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(branch),
  });

  return response.json();
};

// Inventory
export const getInventory = async () => {
  const response = await fetch(`${API_BASE_URL}/inventory`);
  return response.json();
};

export const addInventory = async (inventory) => {
  const response = await fetch(`${API_BASE_URL}/inventory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(inventory),
  });

  return response.json();
};

export const updateInventory = async (id, inventory) => {
  console.log("Updating inventory:", id, inventory);

  const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(inventory),
  });

  const result = await response.json();
  console.log("Update inventory result:", result);
  return result;
};

export const deleteInventory = async (id) => {
  console.log("Deleting inventory:", id);

  const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
    method: "DELETE",
  });

  const result = await response.json();
  console.log("Delete inventory result:", result);
  return result;
};

// Sales
export const getSales = async () => {
  const response = await fetch(`${API_BASE_URL}/sales`);
  return response.json();
};

export const addSale = async (sale) => {
  const response = await fetch(`${API_BASE_URL}/sales`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sale),
  });

  return response.json();
};

export const deleteSale = async (id) => {
  const response = await fetch(`${API_BASE_URL}/sales/${id}`, {
    method: "DELETE",
  });

  return response.json();
};

export const updateSale = async (id, sale) => {
  const response = await fetch(`${API_BASE_URL}/sales/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sale),
  });

  return response.json();
};