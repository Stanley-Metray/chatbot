const cron = require('node-cron');
const Message = require('../models/message');
const ArchivedMessage = require('../models/archived-messages');

const archiveOldMessages = async () => {
    const today = new Date();
    today.setDate(today.getDate() - 1);

    try {
        const transaction = await sequelize.transaction();
        await Message.findAll({
            where: {
                createdAt: {
                    [Sequelize.Op.lt]: today,
                },
            },
            transaction,
        }).then(async (messages) => {
            if (messages.length > 0) {
                await ArchivedMessage.bulkCreate(messages, { transaction });
                await Message.destroy({ where: { createdAt: { [Sequelize.Op.lt]: today } }, transaction });
            }
        });
        await transaction.commit();

        console.log('Archived old messages successfully.');
    } catch (error) {
        await transaction.rollback();
        console.error('Error archiving messages:', error);
    }
}

module.exports.archiveDailyMessages = () => {
    const archiveJob = cron.schedule('0 0 * * *', archiveOldMessages, {
        scheduled: true,
    });

    archiveJob.start();
}