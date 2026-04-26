import {Container, Button} from "react-bootstrap";
import {useNavigate, useSearchParams} from 'react-router-dom';
import {useState, useEffect} from 'react'
import Spinner from 'react-bootstrap/Spinner'

export default function Product() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const [product, setProduct] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    
    useEffect(() => {
        const fetchProduct = async () => {
            const response = await fetch(`https://dummyjson.com/products/${id}`);
            if(!response.ok){
                throw new Error("Product not found");
            }
            const data = await response.json();
            setProduct(data);
        }
        fetchProduct();
    }, [id])
    if(product === null){
        return(<p>Loading...</p>)
    }


    return(
        <Container>
            <h1>Individual Product</h1>
            <p>The product you selected was:{product.title}</p>
            <h2>weight: {product.weight}</h2>
            <div style={{display:"flex", justifyContent:"center" }}>
                {!imageLoaded && <Spinner animation="border" />}
                <img src={product.images[0]} alt="product.title" 
                style={{width:"300px", height:"auto", display:imageLoaded ? "block":"none"}}
                onLoad={() => setImageLoaded(true)}/>
            </div>
            <p>Description: {product.description}</p>
            <Button variant="info" size="sm" className="mt-3"
            onClick={()=>navigate("/")}>Back</Button>
        </Container>
    )
}