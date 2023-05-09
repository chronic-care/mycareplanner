import React from 'react';
import { Link } from 'react-router-dom';
import { FHIRData } from '../../data-services/models/fhirResources';
import './ErrorMessage.css';

interface ErrorMessageProps {
  fhirData?: FHIRData,

  progressMessage: string,
  progressValue: number,
  resourcesLoadedCount: number,

  errorType: string | undefined,
  userErrorMessage: string | undefined,
  developerErrorMessage: string | undefined,
  errorCaught: Error | string | unknown,
}

export const ErrorMessage: React.FC<ErrorMessageProps> = (props: ErrorMessageProps) => {
  {/* TODO: Consider converting CSS to inline MUI */ }
  return (
    <>
      {
        ((props.userErrorMessage && props.errorType === 'Terminating') || process.env.REACT_APP_SHOW_LINK_TO_PROVIDER_LOGIN_ON_LAUNCH === 'true') &&
        <>
          <p className="black"><b>Navigate</b></p>
          <Link to={{
            pathname: '/provider-login',
            state: {
              fhirData: props.fhirData
            }
          }}>Retrieve records from other healthcare providers</Link>
          <br />
        </>
      }
      {
        props.userErrorMessage &&
        <div className="red">
          <p><b>Error</b></p>
          <p><span>Type: </span>{props.errorType}</p>
          <p><span>Message: </span>{props.userErrorMessage}</p>
          <p><span>Technical Message: </span>{props.developerErrorMessage}</p>
          <p><span>Error Caught Message: </span>{props.errorCaught}</p>
          <p><span>Support: </span>{process.env.REACT_APP_SUPPORT_EMAIL_MESSAGE}</p>
          {
            props.errorType === 'Terminating' &&
            <>
              <div className="blue">
                <p><b>Collected Progress Data</b></p>
                <p><span>Percentage Completed: </span>{props.progressValue}%</p>
                <p><span>Last Status Message: </span>{props.progressMessage}</p>
                <p><span>Resources Loaded: </span>{props.resourcesLoadedCount}</p>
              </div>
            </>
          }
        </div>
      }
    </>
  )
}
