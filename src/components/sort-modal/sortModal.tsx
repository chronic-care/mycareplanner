import React from 'react';
import { Button, Form, Modal } from 'react-bootstrap';

interface SortModalProps {
    showModal: boolean;
    closeModal: () => void;
    onSubmit: (sortOption: string, filterOption: string) => void;
    sortingOptions: { value: string; label: string }[]; // Array of sorting options
    filteringOptions: { value: string; label: string }[];
}

export const SortModal: React.FC<SortModalProps> = ({ showModal, closeModal, onSubmit, sortingOptions, filteringOptions }) => {
    const [sortOption, setSortOption] = React.useState<string>('');
    const [filterOption, setFilterOption] = React.useState<string>('');

    const handleSortOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSortOption(event.target.value);
    };

    const handleFilterOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilterOption(event.target.value);
    };

    const handleSubmit = () => {
        onSubmit(sortOption, filterOption);
    };

    return (
        <>
            <Modal show={showModal} onHide={closeModal} animation={false} size='sm'>
                <Modal.Header closeButton>
                    <Modal.Title>Sort/Filter</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                    <h5>Sort Options:</h5>
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
                        <h5>Filter Options:</h5>
                        {filteringOptions.map(option => (
                            <Form.Check
                                key={option.value}
                                type='switch'
                                id={`filter-${option.value}`}
                                name='filteringOptions'
                                value={option.value}
                                label={option.label}
                                onChange={handleFilterOptionChange}
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
