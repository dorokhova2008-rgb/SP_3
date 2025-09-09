import './App.css'
import Home from "./Home";
import About from "./About";
import Product from "./Product";
import Login from './Login';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import Menu from './Menu';
import GlobalStyles from './GlobalStyles';


function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <GlobalStyles>
          <Menu/>
          <Routes>
            <Route path='/' element={<Home/>}/>
            <Route path='/about' element={<About/>}/>
            <Route path='/product/:id' element={<Product/>}/>
            <Route path='/login' element={<Login/>}/>
          </Routes>
        </GlobalStyles>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App
