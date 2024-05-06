import React from 'react';
import { Button, Form, Modal } from 'react-bootstrap';

interface SortOnlyModalProps {
    showModal: boolean;
    closeModal: () => void;
    onSubmit: (sortOption: string) => void;
    sortingOptions: { value: string; label: string }[]; // Array of sorting options
}

export const SortOnlyModal: React.FC<SortOnlyModalProps> = ({ showModal, closeModal, onSubmit, sortingOptions }) => {
    const [sortOption, setSortOption] = React.useState<string>('');

    const handleSortOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSortOption(event.target.value);
    };

    const handleSubmit = () => {
        onSubmit(sortOption);
    };

    return (
        <>
            <Modal show={showModal} onHide={closeModal} animation={false} size='sm'>
                <Modal.Header closeButton>
                    <Modal.Title>Sort Options</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {sortingOptions.map(option => (
                            <Form.Check
                                key={option.value}
                                type='radio'
                                id={`radio-${option.value}`}
                                name='sortingOptions'
                                value={option.value}
                                label={option.label}
                                onChange={handleSortOptionChange}
                            />
                        ))}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button className='close-button' onClick={closeModal}>
                        Cancel
                    </Button>
                    <Button className='submit-button' onClick={handleSubmit}>
                        Apply
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};
