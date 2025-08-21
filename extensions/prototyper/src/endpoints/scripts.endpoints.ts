export default (router: any, context: any) => {
    router.get('/status', async (req: any, res: any) => {
        res.json({ status: 'Script Composer is running' });
    });
};
