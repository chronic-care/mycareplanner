import FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import { Questionnaire, QuestionnaireResponse } from '../fhir-types/fhir-r4';
import { properties } from './properties';

export function getLocalQuestionnaire(id: String) {
    let publicPath = `${process.env.PUBLIC_URL}`;
    let resourcePath = publicPath + '/content/' + id + ".json";
    return fetch(resourcePath)
        .then((response)      => {
            return response.json();
        })
        .then((questionnaireJson) => {
            return questionnaireJson as Questionnaire
        }).catch(error => {
            return error;
        });
}

export function getQuestionnaire(serverUrl:any){
    let url:string;
    return FHIR.oauth2.ready()
        .then((client: Client) => {
            url = client.state.serverUrl;
            return client.request('Questionnaire/' + properties.QUESTIONNAIRE_ID);
        })
        .then((questionnaire)=>{
            serverUrl.push(url + '/Questionnaire/' + questionnaire.id);
            return questionnaire;
        }).catch(error => {
            return error;
        });
}

export function submitQuestionnaireResponse(questionnaireResponse: QuestionnaireResponse){
    return FHIR.oauth2.ready()
        .then((client: Client) => {
            // @ts-ignore
            return client.create(questionnaireResponse)
        })
        .then((response) => {
            return response
        }).catch(error => {
            console.log('oops: ', error)
        });
}
