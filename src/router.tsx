import React from 'react';
import ReactDom from 'react-dom'
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import App from './App';
import {ConfirmationPage } from './components/confirmation-page/ConfirmationPage'

const Router = () => {
    <BrowserRouter>
        <Switch>
            <Route path='/confirmation' component={ConfirmationPage} />
            <Route path='/' component={App} />
        </Switch>
    </BrowserRouter>
}
