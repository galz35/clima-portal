IF OBJECT_ID('dbo.p_ProyectoEvidencias', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.p_ProyectoEvidencias (
        idEvidencia INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        idProyecto INT NOT NULL,
        slot TINYINT NOT NULL,
        fileNameOriginal NVARCHAR(260) NOT NULL,
        fileNameStored NVARCHAR(260) NOT NULL,
        mimeType NVARCHAR(100) NOT NULL,
        fileSizeBytes INT NOT NULL,
        relativePath NVARCHAR(500) NOT NULL,
        createdAt DATETIME NOT NULL CONSTRAINT DF_ProyectoEvidencias_CreatedAt DEFAULT (GETDATE()),
        updatedAt DATETIME NULL,
        CONSTRAINT FK_ProyectoEvidencias_Proyecto FOREIGN KEY (idProyecto) REFERENCES dbo.p_Proyectos(idProyecto),
        CONSTRAINT UQ_ProyectoEvidencias_ProyectoSlot UNIQUE (idProyecto, slot),
        CONSTRAINT CK_ProyectoEvidencias_Slot CHECK (slot IN (1, 2)),
        CONSTRAINT CK_ProyectoEvidencias_FileSize CHECK (fileSizeBytes > 0 AND fileSizeBytes <= 1000000)
    );
END
GO
