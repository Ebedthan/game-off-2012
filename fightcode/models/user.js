module.exports = function(sequelize, DataTypes) {
    return sequelize.define('User', {
        id: { type: DataTypes.INTEGER, autoIncrement: true },
        token: { type: DataTypes.STRING, allowNull: false},
        email: { type: DataTypes.STRING, allowNull: false},
        login: { type: DataTypes.STRING, allowNull: false},
        name: { type: DataTypes.STRING, allowNull: false},
        githubId: { type: DataTypes.INTEGER, allowNull: false, unique: true}
    }, {
        underscored: true
    });
};
