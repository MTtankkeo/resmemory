import React,{ useState } from "react";
import { useNavigate } from "react-router-dom";

import { Header } from "../templates/Header.jsx";
import { Picture } from "../../assets/icons/Picture.jsx";
import { code } from "../../data/code.js"

import "./Write.css"

/** @type {React.FC} */
export const WritePage = () => {

    const categories= ["카테고리 선택", "2020", "2010", "2000", "1990", "1980", "1970"]
    const [category, setCategory] = useState(null)
    const [image, setImage] = useState(null)
    const [title, setTitle] = useState(null)
    const [content, setContent] = useState(null)

    const navigate = useNavigate()

    const Write = async () => {
        const form = new FormData();
        form.append('authorization', sessionStorage.getItem('Authorization'));
        form.append('category', category);
        form.append('title', title);
        form.append('content', content);
        form.append('img', image);

        const response = await fetch(`./api/posts`, {
            method: 'POST',
            body: form,
        });
        const result = await response.json();
        alert(code[result.responseData.code]);
        navigate("/")
    }
    const Cancle = () => {
        navigate("/")
    }

    return (
        <>
            <title>그땐 G:Then - 글 작성</title>
            <Header/>
            <div className="write-post-page">
                <div>
                    <CategorySelector setCategory = { setCategory } categories = { categories }/>
                    <input onChange={(e)=>{setTitle(e.target.value)}}/>
                    <ImageInput setImage={ setImage } image={ image }/>
                    <textarea id = "content" onChange={(e)=>{setContent(e.target.value)}}/>
                    <div id="write-post-buttons">
                        <button id = "post-cancle" onClick={Write}>작성</button>
                        <button id = "post-write" onClick={Cancle}>취소</button>
                    </div>
                </div>
            </div>
        </>
    )
}

/** @type {React.FC<{setCategory:React.Dispatch<React.SetStateAction<string>>, categories:string}>} */
const CategorySelector = ({ setCategory, categories }) =>{
    return(
        <>
            <select className="annual-select" onChange={(e)=>{setCategory(e.target.value)}}>
                {categories.map(it =>{
                    return(
                            <option value={it=="카테고리 선택"?null:it}>{it=="카테고리 선택"?it:it+"'s"}</option>
                        )
                    })
                }
            </select>
        </>
    )
}


/** @type {React.FC<{setImage:React.Dispatch<React.SetStateAction>}>} */
const ImageInput = ({ image, setImage }) => {
    return(
        <div>
            <input type="file" accept="image/*" style={{ display : "none" }} onChange = {(e)=>{setImage(e.target.files[0])}}></input>
            <button id="image-upload" onClick={()=>{ImageButtonClick(image, setImage)}}  style={{ background: image ? '#FF6E4E' : '#323232' }}>
                <Picture/>{image? "이미지 삭제" : "이미지 업로드"}
            </button>
            <div id="image-path" >{image ? image.name : ""}</div>
        </div>
    )
}

/** @type {React.FC<{setImage:React.Dispatch<React.SetStateAction>}>} */
const ImageButtonClick = (image, setImage) =>{
    if(image){
        setImage(null)
    } else {
        document.querySelector('input[type="file"]').click();
    }
}