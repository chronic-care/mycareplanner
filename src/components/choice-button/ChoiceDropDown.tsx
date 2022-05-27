import React, {createRef} from 'react';
import './ChoiceButton.css';
import { ButtonGroup, DropdownButton, Dropdown } from 'react-bootstrap';
import { QuestionnaireItemAnswerOption } from '../../fhir-types/fhir-r4';

// push/receive STATE on parent component

export default class ChoiceDropDown extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        // console.log('item props:', props)
        this.state = {
            activeButton: false,
            value: '',
            display: undefined
        }
    }
    
    
    public render(): JSX.Element {
        let activeChoiceButton: any = createRef();
        let questionnaireItem = {
            linkId: this.props.linkId,
            type: this.props.type,
            prefix: this.props.prefix,
            answerOption: this.props.answerOption,
            text: this.props.text
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
                <DropdownButton as={ButtonGroup} title='Select one' variant='outline-secondary'
                        ref={activeChoiceButton} onSelect={handleSelect}>
                    {
                        questionnaireItem.answerOption?.map((answerOption: any) => {
                            return <Dropdown.Item eventKey={JSON.stringify(answerOption)}
                                key={JSON.stringify(answerOption)}
                                size="sm"
                                aria-required="true"
                                // variant="outline-secondary"
                                value={JSON.stringify(answerOption)}>
                                {answerOption.valueCoding?.display}
                            </Dropdown.Item>
                        })
                    }
                </DropdownButton>
                </td>
                <td colSpan={2} align="left">{this.state.display ?? ''}</td>
                </tr>
                </tbody></table>
            </div>
        )
    }
}