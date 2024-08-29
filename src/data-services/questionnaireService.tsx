import Client from 'fhirclient/lib/Client';
import { Questionnaire, QuestionnaireResponse } from './fhir-types/fhir-r4';
import { getSupplementalDataClient } from '../data-services/fhirService'

export function getLocalQuestionnaire(id: String) {
    let publicPath = `${process.env.PUBLIC_URL}`;
    let resourcePath = publicPath + '/content/' + id + ".json";
    return fetch(resourcePath)
        .then((response) => {
            return response.json();
        })
        .then((questionnaireJson) => {
            return questionnaireJson as Questionnaire
        }).catch(error => {
            return error;
        });
}

export function getQuestionnaire(serverUrl: any, questionnaireID: string) {
    let url: string;
    return getSupplementalDataClient()
        .then((client: Client | undefined) => {
            if (client) {
                url = client.state.serverUrl;
                return client.request('Questionnaire/' + questionnaireID);
            }
        })
        .then((questionnaire) => {
            serverUrl.push(url + '/Questionnaire/' + questionnaire.id);
            return questionnaire;
        }).catch(error => {
            return error;
        });
}

export function submitQuestionnaireResponse(questionnaireResponse: QuestionnaireResponse) {
    return getSupplementalDataClient()
        .then((client: Client | undefined) => {
            // @ts-ignore
            return client.create(questionnaireResponse)
        })
        .then((response) => {
            return response
        }).catch(error => {
            console.log('Error saving questionnaire response: ', error)
        });
}
