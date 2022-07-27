import React, {createRef} from 'react';
import './ChoiceButton.css';
import { ButtonGroup, DropdownButton, Dropdown, Col, Form, NavItem } from 'react-bootstrap';
import { QuestionnaireItemAnswerOption } from '../../data-services/fhir-types/fhir-r4';

// push/receive STATE on parent component

export default class ChoiceDropDown extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        // console.log('item props:', props)
        this.state = {
            activeButton: false,
            value: '',
            display: undefined,
            selectedOptions: []
        }
    }

    public render(): JSX.Element {
        let activeChoiceButton: any = createRef();
        let questionnaireItem = {
            linkId: this.props.linkId,
            type: this.props.type,
            repeats: this.props.repeats,
            prefix: this.props.prefix,
            answerOption: this.props.answerOption,
            text: this.props.text
        }

        const handleMultiSelect = (event: any) => {
            var selected = this.state.selectedOptions
            let values = Array.from(event.target.options).filter((item: any) => item.selected === true).map((item: any) => item.value as string)
            // console.log("values = " + values)
            values.forEach(value => {
                let index = selected.indexOf(value)
                if (index > -1) {
                    selected.splice(index, 1)
                }
                else {
                    selected.push(value)
                }
            })
            this.setState({selectedOptions: selected})
        }    

        const handleSelect = (value: any) => {
            let answerOption: QuestionnaireItemAnswerOption = JSON.parse(value)
            // console.log('Value: ' + value)
            // console.log('AnswerOption: ' + answerOption)
            let displayString = answerOption?.valueCoding?.display ?? ''
            this.setState({display: displayString})

            if(questionnaireItem.prefix && questionnaireItem.text) {
                questionnaireItem.text = questionnaireItem.prefix + ': ' + questionnaireItem.text;
            }
            collectAnswer(questionnaireItem, value)
            for (let child of activeChoiceButton.current.children) {
                if (child.value === value) {
                    child.classList.add('selected');
                } else {
                    child.classList.remove('selected');
                }
            }
        }

        const collectAnswer = (QuestionnaireItem: any, answer: string) => {
            this.props.parentCallback(QuestionnaireItem, answer);
        }

        return (
            <div className="choice-button-group">
                <table width='100%'><tbody>
                <tr><td colSpan={3}><b>{questionnaireItem.text}</b></td></tr>
                <tr><td colSpan={1} width='30%' align='center'>
                {questionnaireItem.repeats === true ?
                    // questionnaire item allows multiple selection
                    <Form.Group as={Col} controlId="multiselect_field">
                        {/* <Form.Label>Select one or more:</Form.Label> */}
                        <Form.Control as="select" multiple value={this.state.selectedOptions} onChange={handleMultiSelect}>
                            {questionnaireItem.answerOption?.map((answerOption: any) => {
                               return  <option key={JSON.stringify(answerOption)} value={JSON.stringify(answerOption)}>{answerOption.valueCoding?.display}</option>
                            })}
                        </Form.Control>
                    </Form.Group>
                :   // questionnaire item is not multiple selection
                    <DropdownButton as={ButtonGroup} title='Select one' variant='outline-secondary'
                            ref={activeChoiceButton} onSelect={handleSelect}>
                        {
                            questionnaireItem.answerOption?.map((answerOption: any) => {
                                return <Dropdown.Item eventKey={JSON.stringify(answerOption)}
                                    key={JSON.stringify(answerOption)}
                                    size="sm"
                                    aria-required="true"
                                    value={JSON.stringify(answerOption)}>
                                    {answerOption.valueCoding?.display}
                                </Dropdown.Item>
                            })
                        }
                    </DropdownButton>
                }
                </td>
                <td colSpan={2} align="left">{this.state.display ?? ''}</td>
                </tr>
                </tbody></table>
            </div>
        )
    }
}