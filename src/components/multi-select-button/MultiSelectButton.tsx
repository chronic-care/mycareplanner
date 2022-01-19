import React, { createRef } from 'react';
import './MultiSelectButton.css';
import { ButtonGroup, Button } from 'react-bootstrap';
// import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { QuestionnaireItem } from '../../fhir-types/fhir-r4';


export default class MultiSelectButtonComponent extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state =
        {
            checked: false,
            value: ''
        };
    }

    public render(): JSX.Element {
        let activeChoiceButton: any = createRef();
        let questionnaireItem: QuestionnaireItem = {
            linkId: this.props.linkId,
            type: this.props.type,
            prefix: this.props.prefix,
            answerOption: this.props.answerOption,
            text: this.props.text
        }

        const handleClick = (event: any) => {
            if (questionnaireItem.prefix && questionnaireItem.text) {
                questionnaireItem.text = questionnaireItem.prefix + ': ' + questionnaireItem.text;
            }
            collectAnswer(questionnaireItem, event.target.value);
            for (let child of activeChoiceButton.current.children) {
                if (child.value === event.target.value) {
                    child.classList.add('selected');
                } else {
                    child.classList.remove('selected');
                }
            }
        }

        const receiveTextAnswer = (text: string) => {
            if (text.length > 0) {
                questionnaireItem.text = questionnaireItem.prefix + ': ' + questionnaireItem.text;
                this.props.parentCallback(questionnaireItem, JSON.stringify({ valueString: text }));
            }
        }

        const collectAnswer = (QuestionnaireItem: any, answer: string) => {
            this.props.parentCallback(QuestionnaireItem, answer);
        }

        return (
            <div className="multi-container">

                <div className={`multi-button ${this.state.checked ? "selected" : ""}`}>
                    <label>

                        <input
                            value={questionnaireItem.prefix}
                            type="checkbox"
                            checked={this.state.checked}
                            onChange={event => {
                                let checked = event.target.checked
                                this.setState({ checked: checked, value: questionnaireItem.prefix })
                            }
                            } /> <span>{questionnaireItem.prefix}</span>
                    </label>

                </div>

                <div className={`additional-info-box ${this.state.checked ? null : 'hidden'}`} >
                    {
                        this.props.sectionCode === 'pain-location' ? (
                            <div>
                                {this.props.type === 'choice' ? (
                                    <div>
                                        <p>{questionnaireItem.text}</p>
                                        <div className="button-box" ref={activeChoiceButton} >
                                            {
                                                this.props.answerOption?.map((answerOption: any) => {
                                                    return <Button
                                                        key={JSON.stringify(answerOption)}
                                                        value={JSON.stringify(answerOption)}
                                                        onClick={
                                                            (event: any) => {
                                                                handleClick(event);
                                                            }} size="sm" variant="outline-secondary">{answerOption.valueCoding?.display}</Button>
                                                })
                                            }
                                        </div>
                                    </div>

                                ) : (
                                        <div className="other-textbox">
                                            <input type="text" placeholder="Type here..." onChange={event => receiveTextAnswer(event.target.value)} />
                                        </div>
                                    )}
                            </div>
                        ) : (
                                <div>
                                    {this.props.type === 'choice' ? (
                                        <div>
                                            <p className="follow-up-question">{questionnaireItem.text}</p>
                                            <div className="button-box">
                                                <ButtonGroup ref={activeChoiceButton}>
                                                    {
                                                        this.props.answerOption?.map((answerOption: any) => {
                                                            return <Button key={JSON.stringify(answerOption)}
                                                                size="sm"
                                                                aria-required="true"
                                                                variant="outline-secondary"
                                                                value={JSON.stringify(answerOption)}
                                                                onClick={(event: any) =>
                                                                    handleClick(event)
                                                                }>
                                                                {answerOption.valueCoding?.display}
                                                            </Button>
                                                        })
                                                    }
                                                </ButtonGroup>
                                            </div>
                                        </div>
                                    ) : (
                                            <div className="other-textbox">
                                                <input type="text" placeholder="Type here..." onChange={event => receiveTextAnswer(event.target.value)} />
                                            </div>
                                        )}
                                </div>
                            )}
                </div>
            </div>
        )
    }

}