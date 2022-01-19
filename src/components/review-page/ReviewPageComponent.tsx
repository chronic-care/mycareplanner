import React from 'react';
import './ReviewPageComponent.css';
import { Table } from 'react-bootstrap';
import parser from 'html-react-parser';
import { QuestionnaireResponseItem } from '../../fhir-types/fhir-r4';
import moment from 'moment';


export default class ReviewPageComponent extends React.Component<any, any> {

    public render(): JSX.Element {

        let sortedList = this.props.item.sort((a: any, b: any) => (Number(a.linkId) > Number(b.linkId)) ? 1 : -1)
        return (
            <div className="review-page-container">

                {sortedList.map((question: QuestionnaireResponseItem) => {
                    let text = JSON.stringify(question.text)

                    if (question.answer) {
                        return (<div className='question-response-container' key={question.linkId}>
                            <div className="text-response-container">
                                <h5>Question:</h5>
                                <h6 className="text-response-question">{parser(text, {
                                    // eslint-disable-next-line 
                                    replace: ({ attribs }) => attribs && attribs.id === '\\\"replace\\\"' && <React.Fragment />
                                })}</h6>
                                {/* <p className="text-response-answer">Answer: {question.answer[0].valueString || question.answer[0].valueDateTime}</p> */}
                                <Table responsive bordered striped size="sm">
                                    <thead>
                                        <tr>
                                            <th>Answer</th>
                                            {/* <th><Button type="button" onClick={this.props.goEdit()}>Edit Response</Button> </th> */}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>{question.answer[0].valueString ||  moment(question.answer[0].valueDateTime).format('MMMM Do YYYY, h:mm:ss a')}</td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                        </div>)

                    } else {

                        return (
                            <div className='question-response-container' key={question.linkId}>
                                <h6>{parser(text)}</h6>
                                {
                                    <Table responsive bordered striped size="sm">
                                        <thead>
                                            <tr>
                                                <th>Question</th>
                                                <th>Answer</th>
                                                {/* <th><Button type="button" onClick={this.props.goEdit()}>Edit Response</Button> </th> */}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {question.item?.map((item: QuestionnaireResponseItem) => {
                                                if (item.answer!.length > 0) {
                                                    if (item.answer![0].valueCoding) {
                                                        return (
                                                            <tr key={item.linkId}>
                                                                <td>{parser(JSON.stringify(item.text))}</td>
                                                                <td>{item.answer![0].valueCoding?.display}</td>
                                                            </tr>
                                                        )

                                                    }
                                                    if (item.answer![0].valueString!.length > 0) {

                                                        return (
                                                            <tr key={item.linkId}>
                                                                <td>{parser(JSON.stringify(item.text))}</td>
                                                                <td>{item.answer![0].valueString}</td>
                                                            </tr>
                                                        )
                                                    } else if (item.answer![0].valueDateTime!.length > 0) {
                                                        return (
                                                            <tr key={item.linkId}>
                                                                <td>{parser(JSON.stringify(item.text))}</td>
                                                                <td>{item.answer![0].valueDateTime}</td>
                                                            </tr>
                                                        )
                                                    } else {
                                                        return <tr key={item.linkId}>
                                                            <td>{parser(JSON.stringify(item.text))}</td>
                                                            <td>Not answered.</td>
                                                        </tr>
                                                    }
                                                }
                                                return (
                                                    <tr>

                                                        <td>nothing here!</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </Table>
                                }
                            </div>
                        )
                    }
                })
                }
            </div>


        )
    }

}