import React from "react"

import { LogoIcon } from "../../assets/icons/logo.jsx";
import { Button } from "../components/button.jsx";

/** @type {React.FC} */
export const Header = () => {
    return (
        <div className="header">
            <LogoIcon />
            <div className="nav">
                <Button.Tertiary text="쓰레드" isNew={true} onClick={() => { console.log("hello world") }} />
                <Button.Tertiary text="채팅" onClick={() => { console.log("hello world") }} />
                <Button.Tertiary text="로그인 하기" onClick={() => { console.log("hello world") }} />
            </div>
        </div>
    )
}

