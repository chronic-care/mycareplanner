import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import App from './App'
import * as serviceWorker from './serviceWorker'
import 'bootstrap/dist/css/bootstrap.min.css'
// import { GoalList } from './components/summaries/GoalList'
// import { ConditionList } from './components/summaries/ConditionList'
// import { MedicationList } from './components/summaries/MedicationList'
// import { ServiceRequestList } from './components/summaries/ServiceRequestList'

ReactDOM.render(
    <React.StrictMode >
        <BrowserRouter basename={process.env.PUBLIC_URL}>
            <Switch>
                <Route exact path='/' component={App} />
                <Route exact path='/index.html' component={App} />
                {/* <Route path="/goals" component={GoalList} />
                <Route path="/concerns" component={ConditionList} />
                <Route path="/medications" component={MedicationList} />
                <Route path="/activities" component={ServiceRequestList} /> */}
                <Route component={App} />
            </Switch>
        </BrowserRouter>
        {/* <App basename={process.env.PUBLIC_URL} /> */}
    </React.StrictMode>,
    document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
