import { useState, useEffect } from 'react'
import './App.css'
import { AllCommunityModule, themeBalham } from 'ag-grid-community';
import { AgGridProvider, AgGridReact } from 'ag-grid-react';
import {Container, Button, Badge} from "react-bootstrap";
import Product from "./Product.jsx";
import { useNavigate } from 'react-router-dom';



function App() {
    const [rowData, setRowData] = useState(null);
    const navigate = useNavigate();

    const columns = [
        { headerName: "Title", field: "title" },
        { headerName: "Category", field: "category" },
        { headerName: "Price ($)", field: "price" },
        { headerName: "Rating", field: "rating" },
        { headerName: "Remaining Stock", field: "stock" }
    ]

    useEffect(() => {
        const fetchProduct = async () => {
            const response = await fetch(`https://dummyjson.com/products/`);
            if(!response.ok){
                throw new Error("Product not found");
            }
            const data = await response.json();
            setRowData(data.products);
        }
        fetchProduct();
    }, [])

    return (
      <Container>
        <h1>Product Catalogue</h1>
        <p>
          <Badge bg="success">{rowData?.length ?? 0}</Badge>products available in the catalogue
        </p>
        <AgGridProvider modules={[AllCommunityModule]}>
            <div style={{ height: "300px", width: "1024px" }}>
                <AgGridReact
                    theme={themeBalham}
                    columnDefs={columns}
                    rowData={rowData}
                    pagination
                    paginationPageSize={20}
                    onRowClicked={row => navigate(`/product?id=${row.data.id}`)}
                />
            </div>
        </AgGridProvider>
        <Button variant="info" size="sm" className="mt-3" href="https://dummyjson.com/docs/" target="_blank">Go to DummyJSON API</Button>
      </Container>
      
    );

}

export default App

