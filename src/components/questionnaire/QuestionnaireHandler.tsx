import '../../App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { createRef } from 'react';
import { Redirect } from 'react-router-dom';
import { InfoModal } from '../info-modal/InfoModal';
import QuestionnaireComponent from './QuestionnaireComponent';
import { Questionnaire, QuestionnaireResponse, QuestionnaireResponseItem, QuestionnaireResponseItemAnswer } from '../../fhir-types/fhir-r4';
import { submitQuestionnaireResponse, getLocalQuestionnaire } from '../../service/questionnaireService';
import { PatientSummary } from '../../models/cqlSummary';

interface QuestionnaireHandlerProps {
  history?: any
}

interface QuestionnaireHandlerState {
  questionnaireId?: string,
  patientSummary?: PatientSummary,

  showModal: Boolean,
  busy: Boolean,
  status: string,
  errorMessage?: string,
  selectedQuestionnaire?: Questionnaire,
  questionnaireResponse: QuestionnaireResponse,
  serverUrl: []
}

export class QuestionnaireHandler extends React.Component<QuestionnaireHandlerProps, QuestionnaireHandlerState> {
  questionnaireContainer: any = createRef();
  handleModal: any = createRef();

  constructor(props: QuestionnaireHandlerProps) {
    super(props);
    this.state =
    {
      ...this.props.history.location.state,

      showModal: false,
      status: 'not-started',
      errorMessage: undefined,
      busy: true,
      selectedQuestionnaire: undefined,
      questionnaireResponse: {
        resourceType: "QuestionnaireResponse",
        status: "in-progress",
        item: []
      },
      serverUrl: []
    };
    this.handleChange = this.handleChange.bind(this);
    this.submitAnswers = this.submitAnswers.bind(this);
    this.startQuestionnaire = this.startQuestionnaire.bind(this);
  }

  componentDidMount() {
    if (this.state.questionnaireId === undefined) {
      return
    }
    getLocalQuestionnaire(this.state.questionnaireId!)
      .then(questionnaire => {
        if (questionnaire === undefined || questionnaire.resourceType !== 'Questionnaire') {
          let message = 'Questionnarie not found: ' + this.state.questionnaireId
          throw Error(message)
        }

        const processQuestionnaire = (p: any) => {
          return (p as Questionnaire)
        }
        let updatedQuestionnaire = processQuestionnaire(questionnaire);

        let ptRef = "Patient/" + this.state.patientSummary?.patientId ?? "unknown"
        let ptDisplay = String(this.state.patientSummary?.fullName)
        this.selectQuestionnaire(updatedQuestionnaire, ptRef, ptDisplay);

        this.startQuestionnaire()

      }).catch(error => {
        this.setState({ busy: false, status: 'error', errorMessage: error.message }, () => {
          console.log('err: ', error.message)
        })
      })
  }

  selectQuestionnaire(selectedQuestionnaire: Questionnaire, ptRef: string, ptDisplay: string): void {
    this.setState({
      selectedQuestionnaire: selectedQuestionnaire,
      questionnaireResponse: {
        ...this.state.questionnaireResponse,
        questionnaire: this.state.serverUrl.pop(),
        subject: {
          reference: ptRef,
          display: ptDisplay
        },
        item: []
      }
    });
  }

  handleChange(item: QuestionnaireResponseItem, answer?: QuestionnaireResponseItemAnswer[]): void {
    this.setState(state => {
      for (let i = 0; i < state.questionnaireResponse.item!.length; i++) {
        if (item.linkId === state.questionnaireResponse.item![i].linkId) {
          state.questionnaireResponse.item![i] = item;
          state.questionnaireResponse.item!.splice(i, 1)
        }
      }
      const questionnaireResponse = {
        ...this.state.questionnaireResponse,
        resourceType: state.questionnaireResponse.resourceType,
        status: state.questionnaireResponse.status,
        item: state.questionnaireResponse.item!.concat(item)
      };
      return {
        questionnaireResponse
      }

    }, () => {
      // console.log('Questionnaire RESPONSE: ', this.state.QuestionnaireResponse);
    })
  }

  formatDateItem(dateItem: number) {
    let returnDateItem: string;
    dateItem < 10 ? returnDateItem = '0' + dateItem : returnDateItem = dateItem.toString();
    return returnDateItem;
  }
  getCurrentDate() {
    let date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let hours = date.getHours();
    let min = date.getMinutes();
    let sec = date.getSeconds();
    let zone = date.getTimezoneOffset() / 60;
    //      "2020-06-19T12:05:43-06:00"
    return year + '-' + this.formatDateItem(month) + '-' + this.formatDateItem(day) + 'T' + this.formatDateItem(hours) + ':' + this.formatDateItem(min) + ':' + this.formatDateItem(sec) + '-' + this.formatDateItem(zone) + ':00';
  }

  startQuestionnaire = () => {
    this.setState({ status: 'in-progress' }, () => {
      if (this.questionnaireContainer.current) {
        this.questionnaireContainer.current.firstChild.firstChild.classList.add('active');
        this.questionnaireContainer.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }
    });
  }

  // preparing to be able to go directly to the question to edit the response
  // this will go in the onEdit property of QuestionnaireComponent
  goToEditQuestionnaire = () => {
    this.setState({ status: 'in-progress' }, () => {
      if (this.questionnaireContainer.current) {
        this.questionnaireContainer.current.firstElementChild.children[this.state.selectedQuestionnaire?.item?.length || 0].classList.add('active');
        this.questionnaireContainer.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }

    });
  }

  handleOpenModal = () => {
    this.handleModal.current.handleShow();
  }

  submitAnswers(): void {
    this.setState(state => {
      const questionnaireResponse = {
        ...this.state.questionnaireResponse,
        resourceType: state.questionnaireResponse.resourceType,
        authored: this.getCurrentDate(),
        status: "completed",
        meta: this.state.selectedQuestionnaire?.meta,
        item: state.questionnaireResponse.item
      };
      return {
        questionnaireResponse,
        busy: true
      }
    }, () => {
      submitQuestionnaireResponse(this.state.questionnaireResponse)
        .then(res => {
          this.setState({ status: 'completed', busy: false })
          console.log("res: ", res);
        })
        .catch(error => {
          this.setState({ status: 'error', busy: false, errorMessage: error.message })
          console.error(error);
        });
    })
  }

  setTheme(color: string) {
    document.documentElement.style.setProperty('--color-dark', color);
  }

  public render(): JSX.Element {
    if (this.state.status === "completed") {
      return <Redirect push to="/confirmation" />;
    }
    if (this.state.status === "error") {
      return <Redirect push to={
        {
          pathname: "/error/",
          state: this.state.errorMessage
        }
      } />;
    }
    if (this.state.selectedQuestionnaire) {
      return (
        <div className="app">
          <div ref={this.questionnaireContainer}>
            <QuestionnaireComponent questionnaire={this.state.selectedQuestionnaire}
              questionnaireResponse={this.state.questionnaireResponse} onEdit={this.goToEditQuestionnaire}
              onChange={this.handleChange} onSubmit={(event: any) => { this.handleOpenModal() }} />
            <InfoModal ref={this.handleModal} show={this.state.showModal} onSubmit={this.submitAnswers}></InfoModal>
            {/* <hr /> */}
          </div>

          {/* <hr /> */}
          {/* <div className="response-container">QuestionnaireResponse: {JSON.stringify(this.state.QuestionnaireResponse)}</div> */}
        </div>
      )
    }

    return (
      <div>
        <p>Error loading questionnaire</p>
      </div>
    )
  }
}
