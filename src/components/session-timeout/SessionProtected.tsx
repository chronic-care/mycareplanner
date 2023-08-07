import React from 'react';
import { Redirect } from 'react-router-dom';

type ProtectedProps = {
    isLoggedIn: boolean;
    children: JSX.Element;
}

const SessionProtected = ({ isLoggedIn, children }: ProtectedProps) => {
    if (!isLoggedIn) {
        return <Redirect to="/" />;
    }
    return children;
};

export default SessionProtected;