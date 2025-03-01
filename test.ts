import inquirerCheckboxWithSearch from './src/index';


inquirerCheckboxWithSearch({
    checkbox: {
        message : 'Select language',
        choices : [
            {
                value: '1',
                name : 'Typescript',
            },
            {
                value: '2',
                name : 'Javascript',
            },
            {
                value: '3',
                name : 'C#',
            }, {
                value: '4',
                name : 'Python',
            },
        ],
        required: true,
        theme   : {
            helpMode: 'always',
        },
    },
    input   : {},
})
    .then((response) => console.log(response));
