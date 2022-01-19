import React from "react";
import { Link } from 'react-router-dom';
import './ConfirmationPage.css';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';



export const ConfirmationPage = () => {

    return <div className="confirmation-page">
        <div className="confirmation-container">
            <h1> <FontAwesomeIcon icon={faCheckCircle} /></h1>
            <h2>Congratulations!</h2>
            <p>Your responses have been successfully recorded.</p>
            <Link to='/'>Return to Home</Link>
        </div>

    </div>
}