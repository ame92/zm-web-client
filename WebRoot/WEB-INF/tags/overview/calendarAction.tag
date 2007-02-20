<%@ tag body-content="empty" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="app" uri="com.zimbra.htmlclient" %>
<%@ taglib prefix="zm" uri="com.zimbra.zm" %>


<app:handleError>
<c:choose>
    <c:when test="${!empty param.actionCreate}">
        <c:set var="newFolderName" value="${fn:trim(param.newFolderName)}"/>
        <c:set var="newFolderColor" value="${fn:trim(param.newFolderColor)}"/>
        <c:set var="newFolderFlag" value="${fn:trim(param.newFolderFlag)}"/>
        <c:choose>
            <c:when test="${empty newFolderName}">
                <app:status style="Warning">
                    <fmt:message key="actionNoCalendarNameSpecified"/>
                </app:status>
            </c:when>
            <c:otherwise>
                <zm:createFolder parentid="1" var="folder" name="${newFolderName}" view="appointment" color="${fn:substring(newFolderColor,2,-1)}" flags="#${newFolderFlag}"/>
                <app:status>
                    <fmt:message key="actionCalendarCreated">
                        <fmt:param value="${newFolderName}"/>
                    </fmt:message>
                </app:status>
            </c:otherwise>
        </c:choose>
    </c:when>
    <c:when test="${!empty param.actionLink}">
        <c:set var="linkedOwnersEmail" value="${fn:trim(param.linkedOwnersEmail)}"/>
        <c:set var="linkedOwnersCalendar" value="${fn:trim(param.linkedOwnersCalendar)}"/>
        <c:set var="linkedFolderName" value="${fn:trim(param.linkedFolderName)}"/>
        <c:set var="linkedFolderColor" value="${fn:trim(param.linkedFolderColor)}"/>
        <c:set var="linkedFolderFlag" value="${fn:trim(param.linkedFolderFlag)}"/>
        <c:choose>
            <c:when test="${empty linkedOwnersEmail}">
                <app:status style="Warning">
                    <fmt:message key="actionNoOwnerEmailSpecified"/>
                </app:status>
            </c:when>
            <c:when test="${empty linkedOwnersCalendar}">
                <app:status style="Warning">
                    <fmt:message key="actionNoOwnerCalendarSpecified"/>
                </app:status>
            </c:when>
            <c:when test="${empty linkedFolderName}">
                <app:status style="Warning">
                    <fmt:message key="actionNoCalendarNameSpecified"/>
                </app:status>
            </c:when>
            <c:otherwise>
                <zm:createMountpoint
                        owner="${linkedOwnersEmail}" ownerby="BY_NAME"
                        shareditem="${linkedOwnersCalendar}" shareditemby="BY_PATH"
                        parentid="1" var="folder" name="${linkedFolderName}" view="appointment"
                        color="${fn:substring(linkedFolderColor,2,-1)}" flags="#${linkedFolderFlag}"/>
                <app:status>
                    <fmt:message key="actionCalendarCreated">
                        <fmt:param value="${newFolderName}"/>
                    </fmt:message>
                </app:status>
            </c:otherwise>
        </c:choose>
    </c:when>
    <c:when test="${!empty param.actionSubscribe}">
        <c:set var="subscribeFolderName" value="${fn:trim(param.subscribeFolderName)}"/>
        <c:set var="subscribeFolderUrl" value="${fn:trim(param.subscribeFolderUrl)}"/>
        <c:set var="subscribeFolderColor" value="${fn:trim(param.subscribeFolderColor)}"/>
        <c:set var="subscribeFolderFlag" value="${fn:trim(param.subscribeFolderFlag)}"/>
        <c:choose>
            <c:when test="${empty subscribeFolderName}">
                <app:status style="Warning">
                    <fmt:message key="actionNoCalendarNameSpecified"/>
                </app:status>
            </c:when>
            <c:otherwise>
                <zm:createFolder parentid="1" var="folder" name="${subscribeFolderName}" url="${subscribeFolderUrl}" view="appointment" color="${fn:substring(subscribeFolderColor,2,-1)}" flags="#${subscribeFolderFlag}"/>
                <app:status>
                    <fmt:message key="actionCalendarSubscribed">
                        <fmt:param value="${newFolderName}"/>
                    </fmt:message>
                </app:status>
            </c:otherwise>
        </c:choose>
    </c:when>
    <c:when test="${not empty param.actionChangeColor}">
        <c:choose>
            <c:when test="${!fn:startsWith(param.folderToChangeColor, 'f:')}">
                <app:status style="Warning">
                    <fmt:message key="actionNoCalendarSelected"/>
                </app:status>
            </c:when>
            <c:when test="${not fn:startsWith(param.newColor, 'c:')}">
                <app:status style="Warning">
                    <fmt:message key="actionNoColorSelected"/>
                </app:status>
            </c:when>
            <c:otherwise>
                <c:set var="folderid" value="${fn:substring(param.folderToChangeColor, 2, -1)}"/>
                <c:set var="color" value="${fn:substring(param.newColor, 2, -1)}"/>
                <zm:modifyFolderColor id="${folderid}" color="${color}"/>
                <c:set var="folderName" value="${zm:getFolderName(pageContext, folderid)}"/>
                <app:status>
                    <fmt:message key="${color}" var="colorMsg"/>
                    <fmt:message key="actionCalendarColorChanged">
                        <fmt:param value="${folderName}"/>
                        <fmt:param value="${colorMsg}"/>
                    </fmt:message>
                </app:status>
            </c:otherwise>
        </c:choose>
    </c:when>
    <c:when test="${not empty param.actionChangeFreeBusy}">
        <c:choose>
            <c:when test="${!fn:startsWith(param.folderToChangeFreeBusy, 'f:')}">
                <app:status style="Warning">
                    <fmt:message key="actionNoCalendarSelected"/>
                </app:status>
            </c:when>
            <c:otherwise>
                <c:set var="folderid" value="${fn:substring(param.folderToChangeFreeBusy, 2, -1)}"/>
                <c:set var="exclude" value="${param.folderFreeBusy eq 'b'}"/>
                <zm:modifyFolderFreeBusy id="${folderid}" exclude="${exclude}"/>
                <c:set var="folderName" value="${zm:getFolderName(pageContext, folderid)}"/>
                <app:status>
                    <fmt:message key="actionCalendarFreeBusyChanged">
                        <fmt:param value="${folderName}"/>
                    </fmt:message>
                </app:status>
            </c:otherwise>
        </c:choose>
    </c:when>
    <c:when test="${not empty param.actionRename}">
        <c:set var="newName" value="${fn:trim(param.newName)}"/>
        <c:choose>
            <c:when test="${empty newName}">
                <app:status style="Warning">
                    <fmt:message key="actionNoCalendarNameSpecified"/>
                </app:status>
            </c:when>
            <c:when test="${!fn:startsWith(param.folderToRename, 'f:')}">
                <app:status style="Warning">
                    <fmt:message key="actionNoCalendarSelected"/>
                </app:status>
            </c:when>
            <c:otherwise>
                <c:set var="folderid" value="${fn:substring(param.folderToRename, 2, -1)}"/>
                <c:set var="oldName" value="${zm:getFolderName(pageContext, folderid)}"/>
                <zm:renameFolder id="${folderid}" newname="${newName}"/>
                <app:status>
                    <fmt:message key="actionCalendarRenamed">
                        <fmt:param value="${oldName}"/>
                        <fmt:param value="${newName}"/>
                    </fmt:message>
                </app:status>
            </c:otherwise>
        </c:choose>
    </c:when>
    <c:when test="${!empty param.actionDelete}">
        <c:choose>
            <c:when test="${!fn:startsWith(param.folderToDelete, 'f:')}">
                <app:status style="Warning">
                    <fmt:message key="actionNoCalendarSelected"/>
                </app:status>
            </c:when>
            <c:otherwise>
                <c:set var="folderid" value="${fn:substring(param.folderToDelete, 2, -1)}"/>
                <c:set var="folderName" value="${zm:getFolderName(pageContext, folderid)}"/>
                <zm:deleteFolder id="${folderid}"/>
                <app:status>
                    <fmt:message key="actionCalendarDeleted">
                        <fmt:param value="${folderName}"/>
                    </fmt:message>
                </app:status>
            </c:otherwise>
        </c:choose>
    </c:when>
    <c:otherwise>

    </c:otherwise>
</c:choose>
</app:handleError>

