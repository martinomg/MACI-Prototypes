export default ({ filter, action, schedule }: any, context: any) => {

    schedule('*/20 * * * * *', async () => {
        console.log('Running scheduled task every segundos');
    });
    
};
