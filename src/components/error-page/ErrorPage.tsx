import React from "react";
import './ErrorPage.css';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { faWindowClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


export const ErrorPage = (props: any) => {
    

    return <div className="error-page">
        <div className="confirmation-container">
            <h1> <FontAwesomeIcon size="2x" icon={faWindowClose} className="error-icon"/></h1>
            <h2>OOPS!</h2>
            <p>{props.location.state}</p>
            <Link to='/'><Button className="continue-button" type="button">Return to home</Button></Link>
        </div>


    </div>
}