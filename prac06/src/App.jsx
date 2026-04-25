import { useState, useEffect } from 'react'
import './App.css'
import { AllCommunityModule, themeBalham } from 'ag-grid-community';
import { AgGridProvider, AgGridReact } from 'ag-grid-react';

function App() {
    const [data, setData] = useState(null);

    useEffect(() => {
        getDatas
    }, []);

    const columns = [
        { headerName: "Title", field: "title" },
        { headerName: "Category", field: "category" },
        { headerName: "Price ($)", field: "price" },
        { headerName: "Rating", field: "rating" },
        { headerName: "Remaining Stock", field: "stock" }
    ]

    return (
        <AgGridProvider modules={[AllCommunityModule]}>
            <div style={{ height: "300px", width: "600px" }}>
                <AgGridReact
                    theme={themeBalham}
                    columnDefs={table.columns}
                    rowData={table.rowData}
                />
            </div>
        </AgGridProvider>
    )
}

export default App


// const table = {
//     columns: [
//         { headerName: "Make", field: "make", sortable: false },
//         { headerName: "Model", field: "model" },
//         { headerName: "Price", field: "price", filter: true },
//     ],
//     rowData: [
//         { make: "Toyota", model: "Camry", price: 28000 },
//         { make: "Ford", model: "Focus", price: 16700 },
//         { make: "Hyundai", model: "Kona", price: 23500 },
//     ]
// };