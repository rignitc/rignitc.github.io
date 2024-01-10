import React,{useState}from 'react'
import Pic from './download.jpg' 
import Img from './img-2897-1@2x.png';
import Image from './whatsapp-image-20230717-at-0243-1@2x.png'; 
import {BsChevronCompactLeft,BsChevronCompactRight} from 'react-icons/bs'; 
import {RxDotFilled} from 'react-icons/rx'


function Project(){ 
    const slides = [Pic,Img,Image,Pic];
  const [currentIndex, setCurrentSlideIndex] = useState(0);

  const nextSlide = () => {
    const isLastSlide =currentIndex===slides.length-1; 
    const newIndex=isLastSlide?0:currentIndex+1;
    setCurrentSlideIndex(newIndex);
  }; 
  const prevSlide =()=>{ 
    const isFirstSlide =currentIndex===0; 
    const newIndex=isFirstSlide?slides.length-1:currentIndex-1;
    setCurrentSlideIndex(newIndex);
  };  
  const gotoslide=(slideIndex)=>{
    setCurrentSlideIndex(slideIndex);
  }
    return( 
        <div>
        <div>
           <h1 className='font-bold text-slate-300 text-center text-5xl '>PROJECTS</h1>
        </div>  

        <div className='max-w-[1400px] h-[500px] w-full m-auto py-16 px-20'> 
        <div className='grid grid-cols-4 grid-rows-1 h-[60vh] gap-4'> 
        <div
        style={{
          backgroundImage: `url(${slides[(currentIndex)%slides.length]})`,
        }}
        className='w-full h-full rounded-2xl bg-center bg-cover duration-500'>
        </div>  
        <div
        style={{
          backgroundImage: `url(${slides[(currentIndex+1)%slides.length]})`,
        }}
        className='w-full h-full rounded-2xl bg-center bg-cover duration-500'>
        </div>
        <div
        style={{
          backgroundImage: `url(${slides[(currentIndex+2)%slides.length]})`,
        }}
        className='w-full h-full rounded-2xl bg-center bg-cover duration-500'>
        </div>
        <div
        style={{
          backgroundImage: `url(${slides[(currentIndex+3)%slides.length]})`,
        }}
        className='w-full h-full rounded-2xl bg-center bg-cover duration-500'>
        </div> 
        <div className=' absolute -translate-x-[px] translate-y-[125px] left-15 text-2xl rounded-full p-2 bg-black/50 text-white cursor-pointer'> 
          <BsChevronCompactLeft onClick={prevSlide} size={30} />
        </div>  
        <div className=' absolute translate-x-[-30px] translate-y-[125px] right-12 text-2xl rounded-full p-2  bg-black/50 text-white cursor-pointer'> 
          <BsChevronCompactRight onClick={nextSlide} size={30}/>
        </div>
        
        </div> 
        <div className='flex top-4 justify-center py-2'>
             {slides.map((slide,slideIndex)=>(
                <div key={slideIndex} 
                onClick={()=>gotoslide(slideIndex)}
                className='text-2xl  cursor-pointer'><RxDotFilled /> </div>
                ))
              }
        </div>
        </div>
    </div>);
} 
export default Project;